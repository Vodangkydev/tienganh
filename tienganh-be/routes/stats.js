const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');

// @route   GET /api/stats
// @desc    Get learning statistics
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const stats = await UserProgress.aggregate([
      { $match: { user_id: req.user._id } },
      {
        $group: {
          _id: null,
          correct: {
            $sum: { $cond: ['$is_correct', 1, 0] }
          },
          nearlyCorrect: {
            $sum: { $cond: ['$is_nearly_correct', 1, 0] }
          },
          incorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$is_correct', false] }, { $eq: ['$is_nearly_correct', false] }] },
                1,
                0
              ]
            }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        correct: 0,
        nearlyCorrect: 0,
        incorrect: 0,
        total: 0
      });
    }

    res.json({
      correct: stats[0].correct,
      nearlyCorrect: stats[0].nearlyCorrect,
      incorrect: stats[0].incorrect,
      total: stats[0].total
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/stats
// @desc    Reset statistics
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await UserProgress.deleteMany({ user_id: req.user._id });
    res.json({ message: 'Statistics reset successfully' });
  } catch (error) {
    console.error('Reset stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

