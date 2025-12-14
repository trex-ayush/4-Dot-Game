const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    type: String,
    required: true
  },
  player2: {
    type: String,
    required: true
  },
  winner: {
    type: String,
    default: null // null = draw, username = winner, 'BOT' if bot wins
  },
  result: {
    type: String,
    enum: ['player1_win', 'player2_win', 'draw', 'forfeit'],
    required: true
  },
  moves: [{
    player: String,
    column: Number,
    row: Number,
    timestamp: Date
  }],
  isAgainstBot: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);