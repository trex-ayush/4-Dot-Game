const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Get game history for a user
router.get('/history/:username', gameController.getGameHistory);

// Get specific game by ID
router.get('/:gameId', gameController.getGameById);

// Get user stats
router.get('/stats/:username', gameController.getUserStats);

module.exports = router;