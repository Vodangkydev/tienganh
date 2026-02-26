const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  word_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vocabulary',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  is_correct: {
    type: Boolean,
    default: false
  },
  is_nearly_correct: {
    type: Boolean,
    default: false
  },
  attempt_count: {
    type: Number,
    default: 1,
    min: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  },
 
});

// Index for faster queries
userProgressSchema.index({ user_id: 1, word_id: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);

