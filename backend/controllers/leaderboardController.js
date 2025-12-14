const User = require('../models/User');

// Get leaderboard (EXCLUDE BOT)
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, sortBy = 'wins' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    // Exclude BOT users from leaderboard (usernames are stored in lowercase)
    const leaderboard = await User.find({ 
      gamesPlayed: { $gt: 0 },
      username: { $ne: 'bot' }
    })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .select('username wins losses draws gamesPlayed');

    // Calculate win rate for each user
    const leaderboardWithRate = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      gamesPlayed: user.gamesPlayed,
      winRate: user.gamesPlayed > 0 
        ? ((user.wins / user.gamesPlayed) * 100).toFixed(2) 
        : 0
    }));

    res.json({
      success: true,
      data: leaderboardWithRate
    });
  } catch (error) {
    next(error);
  }
};

// Get player rank (EXCLUDE BOT)
exports.getPlayerRank = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Don't return rank for BOT
    if (username === 'BOT' || username.toLowerCase() === 'bot') {
      return res.json({
        success: false,
        data: {
          username,
          rank: null,
          message: 'Bot is not ranked'
        }
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.json({
        success: true,
        data: {
          username,
          rank: null,
          message: 'Player not found or has not played any games'
        }
      });
    }

    // Count players with more wins (excluding BOT)
    const playersAbove = await User.countDocuments({
      wins: { $gt: user.wins },
      username: { $ne: 'bot' }
    });

    res.json({
      success: true,
      data: {
        username: user.username,
        rank: playersAbove + 1,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed
      }
    });
  } catch (error) {
    next(error);
  }
};