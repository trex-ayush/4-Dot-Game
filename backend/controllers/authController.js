const User = require('../models/User');

// Check username availability
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const normalizedUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({ username: normalizedUsername });

    if (existingUser) {
      return res.json({
        success: true,
        available: false,
        message: 'Username is already taken',
        user: {
          username: existingUser.username,
          wins: existingUser.wins,
          losses: existingUser.losses,
          draws: existingUser.draws,
          gamesPlayed: existingUser.gamesPlayed,
          winRate: existingUser.winRate
        }
      });
    }

    res.json({
      success: true,
      available: true,
      message: 'Username is available'
    });
  } catch (error) {
    next(error);
  }
};

// Register/Login user (auto-create if not exists)
exports.registerOrLogin = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Validate username format
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Find or create user
    let user = await User.findOne({ username: normalizedUsername });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = new User({
        username: normalizedUsername,
        lastLogin: new Date()
      });
      await user.save();
      isNewUser = true;
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      success: true,
      isNewUser,
      message: isNewUser ? 'Account created successfully!' : 'Welcome back!',
      user: {
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed,
        winRate: user.winRate,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        error: 'Username is already taken'
      });
    }
    next(error);
  }
};

// Get user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed,
        winRate: user.winRate,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};