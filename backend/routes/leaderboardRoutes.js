const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Get leaderboard
router.get('/', leaderboardController.getLeaderboard);

// Get player rank
router.get('/rank/:username', leaderboardController.getPlayerRank);

module.exports = router;