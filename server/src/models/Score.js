const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Null if guest
  },
  username: {
    type: String,
    required: true // Store guest name or user's name
  },
  score: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for getting top scores quickly
scoreSchema.index({ score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
