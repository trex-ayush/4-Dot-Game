const Game = require('../models/Game');
const User = require('../models/User');
const matchmakingService = require('../services/matchmakingService');

// Get game history for a user
exports.getGameHistory = async (req, res, next) => {
  try {
    const { username } = req.params;

    const games = await Game.find({
      $or: [
        { player1: username.toLowerCase() },
        { player2: username.toLowerCase() }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    next(error);
  }
};

// Get specific game details
exports.getGameById = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    // Check active games first
    const activeGame = matchmakingService.getGame(gameId);
    if (activeGame) {
      return res.json({
        success: true,
        data: activeGame,
        isActive: true
      });
    }

    // Check completed games
    const completedGame = await Game.findOne({ gameId });
    if (completedGame) {
      return res.json({
        success: true,
        data: completedGame,
        isActive: false
      });
    }

    res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  } catch (error) {
    next(error);
  }
};

exports.saveCompletedGame = async (gameData, resultData = null) => {
  try {
    // Determine winner username from gameData.winner (which is player number 1 or 2, or null)
    let winnerUsername = null;
    if (gameData.winner === 1 || gameData.winner === 2) {
      winnerUsername = gameData.players[gameData.winner].username;
    }
    
    // Determine result from resultData or gameData
    let result = gameData.result;
    if (!result && resultData) {
      result = resultData.result;
    }
    if (!result) {
      // Fallback: determine from winner
      if (gameData.winner === 1) {
        result = 'player1_win';
      } else if (gameData.winner === 2) {
        result = 'player2_win';
      } else {
        result = 'draw';
      }
    }

    const game = new Game({
      gameId: gameData.gameId,
      player1: gameData.players[1].username.toLowerCase(),
      player2: gameData.players[2].username.toLowerCase(),
      winner: winnerUsername ? winnerUsername.toLowerCase() : null,
      result: result,
      moves: gameData.moves || [],
      isAgainstBot: gameData.isAgainstBot || false,
      duration: gameData.duration || 0
    });

    await game.save();

    // Update user stats (skip BOT users)
    // Pass gameData with winner as number for updateUserStats
    await this.updateUserStats(gameData);

    return game;
  } catch (error) {
    console.error('Error saving game:', error);
    throw error;
  }
};

// Update user statistics (FIXED to skip BOT)
exports.updateUserStats = async (gameData) => {
  try {
    const player1Username = gameData.players[1].username;
    const player2Username = gameData.players[2].username;

    // Skip if player1 is BOT
    if (player1Username !== 'BOT' && !player1Username.includes('BOT')) {
      let player1Update = { $inc: { gamesPlayed: 1 } };
      if (gameData.winner === 1) {
        player1Update.$inc.wins = 1;
      } else if (gameData.winner === 2) {
        player1Update.$inc.losses = 1;
      } else {
        player1Update.$inc.draws = 1;
      }

      await User.findOneAndUpdate(
        { username: player1Username.toLowerCase() },
        player1Update,
        { upsert: true, new: true }
      );
    }

    // Skip if player2 is BOT
    if (player2Username !== 'BOT' && !player2Username.includes('BOT')) {
      let player2Update = { $inc: { gamesPlayed: 1 } };
      if (gameData.winner === 2) {
        player2Update.$inc.wins = 1;
      } else if (gameData.winner === 1) {
        player2Update.$inc.losses = 1;
      } else {
        player2Update.$inc.draws = 1;
      }

      await User.findOneAndUpdate(
        { username: player2Username.toLowerCase() },
        player2Update,
        { upsert: true, new: true }
      );
    }
    
    // If game had bot takeover, update original player stats
    if (gameData.originalPlayer1 && gameData.originalPlayer1 !== 'BOT') {
      let updateData = { $inc: { gamesPlayed: 1, losses: 1 } }; // Count as loss if timed out
      await User.findOneAndUpdate(
        { username: gameData.originalPlayer1.toLowerCase() },
        updateData,
        { upsert: true, new: true }
      );
    }
    
    if (gameData.originalPlayer2 && gameData.originalPlayer2 !== 'BOT') {
      let updateData = { $inc: { gamesPlayed: 1, losses: 1 } }; // Count as loss if timed out
      await User.findOneAndUpdate(
        { username: gameData.originalPlayer2.toLowerCase() },
        updateData,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Get user stats
exports.getUserStats = async (req, res, next) => {
  try {
    const { username } = req.params;

    let user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      user = {
        username: username.toLowerCase(),
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
        winRate: 0
      };
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};