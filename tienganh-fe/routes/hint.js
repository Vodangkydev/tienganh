const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vocabulary = require('../models/Vocabulary');

// @route   GET /api/hint/:wordId
// @desc    Get hint for a word
// @access  Private
router.get('/hint/:wordId', auth, async (req, res) => {
  try {
    const vocabulary = await Vocabulary.findOne({
      _id: req.params.wordId,
      user_id: req.user._id
    });

    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    // Get difficulty from query parameter or default to 1
    const difficulty = parseInt(req.query.difficulty) || 1;

    // Generate hint based on difficulty
    let hint = '';
    const word = vocabulary.english.toLowerCase();
    const wordLength = word.length;
    
    if (difficulty === 1) {
      // Dễ - hiển thị 1-2 chữ cái đầu và cuối
      if (wordLength <= 3) {
        hint = word; // Hiển thị toàn bộ từ nếu quá ngắn
      } else if (wordLength <= 5) {
        hint = word.substring(0, 2) + '*'.repeat(wordLength - 2);
      } else {
        hint = word.substring(0, 2) + '*'.repeat(wordLength - 4) + word.substring(wordLength - 2);
      }
    } else if (difficulty === 2) {
      // Trung bình - hiển thị 1 chữ cái đầu và cuối
      if (wordLength <= 2) {
        hint = word; // Hiển thị toàn bộ từ nếu quá ngắn
      } else {
        hint = word.substring(0, 1) + '*'.repeat(wordLength - 2) + word.substring(wordLength - 1);
      }
    } else {
      // Khó - chỉ hiển thị 1 chữ cái đầu hoặc cuối
      if (wordLength <= 1) {
        hint = word;
      } else {
        // Random chọn hiển thị đầu hay cuối
        const showFirst = Math.random() < 0.5;
        if (showFirst) {
          hint = word.substring(0, 1) + '*'.repeat(wordLength - 1);
        } else {
          hint = '*'.repeat(wordLength - 1) + word.substring(wordLength - 1);
        }
      }
    }

    res.json({ hint, difficulty });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

