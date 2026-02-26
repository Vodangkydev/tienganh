const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vocabulary = require('../models/Vocabulary');
const UserProgress = require('../models/UserProgress');

// Levenshtein distance algorithm for fuzzy matching
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// @route   POST /api/check-answer
// @desc    Check if answer is correct
// @access  Private
router.post('/check-answer', auth, async (req, res) => {
  try {
    const { wordId, answer, languageMode } = req.body;

    if (!wordId || !answer) {
      return res.status(400).json({ message: 'Word ID and answer are required' });
    }

    const vocabulary = await Vocabulary.findOne({
      _id: wordId,
      user_id: req.user._id
    });

    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    // Determine correct answer based on language mode
    const correctAnswer = languageMode === 'vietnamese' 
      ? vocabulary.english.toLowerCase().trim()
      : vocabulary.vietnamese.toLowerCase().trim();
    
    const userAnswer = answer.toLowerCase().trim();
    
    // Check if exact match
    if (userAnswer === correctAnswer) {
      // Save progress
      await UserProgress.findOneAndUpdate(
        { word_id: wordId, user_id: req.user._id },
        {
          word_id: wordId,
          user_id: req.user._id,
          is_correct: true,
          is_nearly_correct: false,
          $inc: { attempt_count: 1 }
        },
        { upsert: true, new: true }
      );

      return res.json({
        result: 'correct',
        correctAnswer,
        pronunciation: vocabulary.pronunciation
      });
    }

    // Check Levenshtein distance for near match
    const distance = levenshteinDistance(userAnswer, correctAnswer);
    const maxLength = Math.max(userAnswer.length, correctAnswer.length);
    const similarity = 1 - (distance / maxLength);

    // Consider it nearly correct if similarity > 0.7
    if (similarity > 0.7) {
      // Save progress
      await UserProgress.findOneAndUpdate(
        { word_id: wordId, user_id: req.user._id },
        {
          word_id: wordId,
          user_id: req.user._id,
          is_correct: false,
          is_nearly_correct: true,
          $inc: { attempt_count: 1 }
        },
        { upsert: true, new: true }
      );

      return res.json({
        result: 'nearly-correct',
        correctAnswer,
        pronunciation: vocabulary.pronunciation,
        similarity: Math.round(similarity * 100)
      });
    }

    // Incorrect answer
    await UserProgress.findOneAndUpdate(
      { word_id: wordId, user_id: req.user._id },
      {
        word_id: wordId,
        user_id: req.user._id,
        is_correct: false,
        is_nearly_correct: false,
        $inc: { attempt_count: 1 }
      },
      { upsert: true, new: true }
    );

    res.json({
      result: 'incorrect',
      correctAnswer,
      pronunciation: vocabulary.pronunciation
    });
  } catch (error) {
    console.error('Check answer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

