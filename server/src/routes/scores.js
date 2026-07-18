const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const auth = require('../middleware/auth');

// @route   POST /api/scores
// @desc    Submit a new score
// @access  Public (Optionally Private)
router.post('/', async (req, res) => {
  const { username, score } = req.body;
  
  // Check if token provided in header to extract user id
  const authHeader = req.header('Authorization');
  let userId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.user.id;
    } catch (err) {
      // invalid token, treat as guest
    }
  }

  try {
    const newScore = new Score({
      userId,
      username: username || 'Guest',
      score
    });

    const savedScore = await newScore.save();
    res.json(savedScore);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/scores/leaderboard
// @desc    Get top scores
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await Score.find()
      .sort({ score: -1 })
      .limit(limit)
      .select('username score date -_id');
      
    res.json(scores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
