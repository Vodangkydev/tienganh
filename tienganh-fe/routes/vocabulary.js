const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vocabulary = require('../models/Vocabulary');
const UserProgress = require('../models/UserProgress');

// @route   GET /api/vocabulary
// @desc    Get all vocabulary for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const vocabularies = await Vocabulary.find({ user_id: req.user._id })
      .sort({ created_at: -1 });
    
    res.json(vocabularies);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/vocabulary/random
// @desc    Get random vocabulary
// @access  Private
router.get('/random', auth, async (req, res) => {
  try {
    const vocabularies = await Vocabulary.find({ user_id: req.user._id });
    
    if (vocabularies.length === 0) {
      return res.status(404).json({ message: 'No vocabulary found' });
    }

    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    const randomWord = vocabularies[randomIndex];
    
    res.json(randomWord);
  } catch (error) {
    console.error('Get random vocabulary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/vocabulary
// @desc    Add new vocabulary
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { vietnamese, english, type, pronunciation, image_url, difficulty } = req.body;

    if (!vietnamese || !english) {
      return res.status(400).json({ message: 'Vietnamese and English words are required' });
    }

    const vocabulary = new Vocabulary({
      user_id: req.user._id,
      vietnamese,
      english,
      type: type || 'noun',
      pronunciation: pronunciation || '',
      image_url: image_url || '',
      difficulty: difficulty || 1
    });

    await vocabulary.save();
    res.status(201).json(vocabulary);
  } catch (error) {
    console.error('Add vocabulary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/vocabulary/:id
// @desc    Delete vocabulary by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const vocabulary = await Vocabulary.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    // Also delete related progress records
    await UserProgress.deleteMany({ word_id: req.params.id, user_id: req.user._id });
    
    await Vocabulary.deleteOne({ _id: req.params.id });
    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    console.error('Delete vocabulary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/vocabulary
// @desc    Delete all vocabulary for user, keeping only "xin chào - hello"
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const vocabularies = await Vocabulary.find({ user_id: req.user._id });
    const wordIds = vocabularies.map(v => v._id);

    // Delete all progress records
    await UserProgress.deleteMany({ 
      user_id: req.user._id,
      word_id: { $in: wordIds }
    });

    // Delete all vocabularies
    await Vocabulary.deleteMany({ user_id: req.user._id });
    
    // Create the word "xin chào - hello"
    const helloWord = new Vocabulary({
      user_id: req.user._id,
      vietnamese: 'xin chào',
      english: 'hello',
      type: 'greeting',
      pronunciation: '/həˈloʊ/',
      image_url: '',
      difficulty: 1
    });
    
    await helloWord.save();
    
    res.json({ message: 'All vocabulary deleted successfully, kept "xin chào - hello"' });
  } catch (error) {
    console.error('Delete all vocabulary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

