const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vietnamese: {
    type: String,
    required: [true, 'Vietnamese word is required'],
    trim: true
  },
  english: {
    type: String,
    required: [true, 'English word is required'],
    trim: true
  },
  type: {
    type: String,
    default: 'noun',
    trim: true
  },
  pronunciation: {
    type: String,
    default: '',
    trim: true
  },
  image_url: {
    type: String,
    default: '',
    trim: true
  },
  difficulty: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
vocabularySchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Vocabulary', vocabularySchema);

