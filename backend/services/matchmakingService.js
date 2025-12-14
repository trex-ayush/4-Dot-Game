const { v4: uuidv4 } = require('uuid');
const GameLogic = require('./gameLogic');

class MatchmakingService {
  constructor() {
    this.waitingPlayers = [];
    this.activeGames = new Map();
    this.playerToGame = new Map();
    this.disconnectedPlayers = new Map();
    this.matchmakingTimeouts = new Map();
    this.pendingChallenges = new Map();
    this.activeChallenges = new Map();
    this.moveTimers = new Map();
    this.playerTimeouts = new Map();
  }

  // MOVE TIMER SYSTEM
  
  startMoveTimer(gameId, currentPlayer, io) {
    this.clearMoveTimer(gameId);
    
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;
    
    const currentUsername = game.players[currentPlayer].username;
    if (currentUsername === 'BOT' || currentUsername.includes('BOT')) return;
    
    console.log(`Starting 30s timer for ${currentUsername} (Player ${currentPlayer}) in game ${gameId}`);
    
    io.to(gameId).emit('move_timer_started', {
      player: currentPlayer,
      username: currentUsername,
      timeLimit: 30
    });
    
    const timer = setTimeout(() => {
      console.log(`Timer expired for ${currentUsername}`);
      this.handleMoveTimeout(gameId, currentPlayer, io);
    }, 30000);
    
    this.moveTimers.set(gameId, timer);
  }
  
  clearMoveTimer(gameId) {
    const timer = this.moveTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.moveTimers.delete(gameId);
      console.log(`Timer cleared for game ${gameId}`);
    }
  }
  
  handleMoveTimeout(gameId, timedOutPlayer, io) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;
    
    const timedOutUsername = game.players[timedOutPlayer].username;
    
    if (this.playerTimeouts.has(`${gameId}-${timedOutPlayer}`)) {
      console.log(`Player ${timedOutUsername} already timed out`);
      return;
    }
    
    console.log(`Player ${timedOutUsername} (Player ${timedOutPlayer}) timed out in game ${gameId}`);
    
    this.playerTimeouts.set(`${gameId}-${timedOutPlayer}`, true);
    
    const originalUsername = timedOutUsername;
    
    game.players[timedOutPlayer] = {
      socketId: 'BOT_TAKEOVER',
      username: 'BOT'
    };
    
    game.botTakeover = true;
    game[`originalPlayer${timedOutPlayer}`] = originalUsername;
    
    io.to(gameId).emit('player_left_timeout', {
      timedOutPlayer,
      username: originalUsername,
      message: `${originalUsername} left (timeout). Bot is taking over!`
    });
    
    if (game.currentPlayer === timedOutPlayer) {
      setTimeout(async () => {
        const BotService = require('./botService');
        const botColumn = BotService.getBestMove(game.board);
        
        const result = this.makeMove(gameId, botColumn, timedOutPlayer);
        
        if (!result.error) {
          io.to(gameId).emit('move_made', {
            column: botColumn,
            row: result.row,
            player: timedOutPlayer,
            username: 'BOT',
            board: game.board,
            currentPlayer: result.nextPlayer,
            isBot: true
          });
          
          if (result.gameOver) {
            // Save game to database
            const gameController = require('../controllers/gameController');
            try {
              await gameController.saveCompletedGame(game);
            } catch (error) {
              console.error('Error saving timeout game:', error);
            }
            
            io.to(gameId).emit('game_over', {
              winner: result.winner,
              result: result.result,
              board: game.board,
              finalMove: { row: result.row, col: botColumn }
            });
            this.clearMoveTimer(gameId);
            this.playerTimeouts.delete(`${gameId}-${timedOutPlayer}`);
            this.endGame(gameId);
          } else {
            const nextPlayerUsername = game.players[result.nextPlayer].username;
            if (nextPlayerUsername !== 'BOT' && !nextPlayerUsername.includes('BOT')) {
              this.startMoveTimer(gameId, result.nextPlayer, io);
            } else {
              this.makeBotMove(gameId, result.nextPlayer, io);
            }
          }
        }
      }, 1500);
    }
  }

  makeBotMove(gameId, botPlayer, io) {
    setTimeout(async () => {
      const game = this.activeGames.get(gameId);
      if (!game || game.status !== 'active') return;
      
      const BotService = require('./botService');
      const botColumn = BotService.getBestMove(game.board);
      
      const result = this.makeMove(gameId, botColumn, botPlayer);
      
      if (!result.error) {
        io.to(gameId).emit('move_made', {
          column: botColumn,
          row: result.row,
          player: botPlayer,
          username: 'BOT',
          board: game.board,
          currentPlayer: result.nextPlayer,
          isBot: true
        });
        
        if (result.gameOver) {
          // Save game to database
          const gameController = require('../controllers/gameController');
          try {
            await gameController.saveCompletedGame(game);
          } catch (error) {
            console.error('Error saving bot game:', error);
          }
          
          io.to(gameId).emit('game_over', {
            winner: result.winner,
            result: result.result,
            board: game.board,
            finalMove: { row: result.row, col: botColumn }
          });
          this.clearMoveTimer(gameId);
          this.endGame(gameId);
        } else {
          const nextPlayerUsername = game.players[result.nextPlayer].username;
          if (nextPlayerUsername !== 'BOT' && !nextPlayerUsername.includes('BOT')) {
            this.startMoveTimer(gameId, result.nextPlayer, io);
          } else {
            this.makeBotMove(gameId, result.nextPlayer, io);
          }
        }
      }
    }, 1000);
  }

  // CHALLENGE SYSTEM

  sendChallenge(fromUsername, toUsername, fromSocketId) {
    if (fromUsername === toUsername) {
      return { error: 'You cannot challenge yourself' };
    }

    if (this.playerToGame.has(fromUsername)) {
      const gameId = this.playerToGame.get(fromUsername);
      const game = this.activeGames.get(gameId);
      if (game && game.status === 'active') {
        return { error: 'You are already in a game' };
      } else {
        this.playerToGame.delete(fromUsername);
      }
    }

    if (this.playerToGame.has(toUsername)) {
      const gameId = this.playerToGame.get(toUsername);
      const game = this.activeGames.get(gameId);
      if (game && game.status === 'active') {
        return { error: 'This player is already in a game' };
      } else {
        this.playerToGame.delete(toUsername);
      }
    }

    const existingChallenges = this.pendingChallenges.get(toUsername) || [];
    const alreadyChallenged = existingChallenges.find(c => c.from === fromUsername);
    
    if (alreadyChallenged) {
      return { error: 'Challenge already sent to this player' };
    }

    const challengeId = uuidv4();
    const challenge = {
      id: challengeId,
      from: fromUsername,
      to: toUsername,
      fromSocketId,
      createdAt: Date.now(),
      status: 'pending'
    };

    this.activeChallenges.set(challengeId, challenge);
    
    if (!this.pendingChallenges.has(toUsername)) {
      this.pendingChallenges.set(toUsername, []);
    }
    this.pendingChallenges.get(toUsername).push(challenge);

    setTimeout(() => {
      this.expireChallenge(challengeId);
    }, 60000);

    return { success: true, challengeId, challenge };
  }

  acceptChallenge(challengeId, acceptingUsername, acceptingSocketId) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge) {
      return { error: 'Challenge not found or expired' };
    }

    if (challenge.to !== acceptingUsername) {
      return { error: 'This challenge is not for you' };
    }

    if (challenge.status !== 'pending') {
      return { error: 'Challenge is no longer available' };
    }

    this.playerToGame.delete(challenge.from);
    this.playerToGame.delete(challenge.to);

    challenge.status = 'accepted';

    const gameId = uuidv4();
    const player1 = { socketId: challenge.fromSocketId, username: challenge.from };
    const player2 = { socketId: acceptingSocketId, username: challenge.to };

    const game = this.createGame(gameId, player1, player2, false);

    this.cleanupChallenge(challengeId, challenge.to);

    return {
      success: true,
      gameId,
      game,
      player1,
      player2
    };
  }

  rejectChallenge(challengeId, rejectingUsername) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge) {
      return { error: 'Challenge not found' };
    }

    if (challenge.to !== rejectingUsername) {
      return { error: 'This challenge is not for you' };
    }

    challenge.status = 'rejected';
    this.cleanupChallenge(challengeId, challenge.to);

    return { success: true };
  }

  cancelChallenge(challengeId, cancelingUsername) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge) {
      return { error: 'Challenge not found' };
    }

    if (challenge.from !== cancelingUsername) {
      return { error: 'You did not send this challenge' };
    }

    challenge.status = 'cancelled';
    this.cleanupChallenge(challengeId, challenge.to);

    return { success: true };
  }

  expireChallenge(challengeId) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (challenge && challenge.status === 'pending') {
      challenge.status = 'expired';
      this.cleanupChallenge(challengeId, challenge.to);
    }
  }

  cleanupChallenge(challengeId, toUsername) {
    this.activeChallenges.delete(challengeId);
    
    const pending = this.pendingChallenges.get(toUsername) || [];
    const filtered = pending.filter(c => c.id !== challengeId);
    
    if (filtered.length > 0) {
      this.pendingChallenges.set(toUsername, filtered);
    } else {
      this.pendingChallenges.delete(toUsername);
    }
  }

  getPendingChallenges(username) {
    const challenges = this.pendingChallenges.get(username) || [];
    return challenges.filter(c => c.status === 'pending');
  }

  getSentChallenges(username) {
    const sent = [];
    this.activeChallenges.forEach(challenge => {
      if (challenge.from === username && challenge.status === 'pending') {
        sent.push(challenge);
      }
    });
    return sent;
  }

  // QUEUE SYSTEM

  addToQueue(socketId, username) {
    const existingPlayer = this.waitingPlayers.find(p => p.username === username);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      return { status: 'already_waiting' };
    }

    if (this.playerToGame.has(username)) {
      const gameId = this.playerToGame.get(username);
      const game = this.activeGames.get(gameId);
      if (game && game.status === 'active') {
        return { status: 'reconnect', gameId, game };
      } else {
        this.playerToGame.delete(username);
      }
    }

    this.waitingPlayers.push({ socketId, username, joinedAt: Date.now() });

    if (this.waitingPlayers.length >= 2) {
      return this.matchPlayers();
    }

    return { status: 'waiting', position: this.waitingPlayers.length };
  }

  matchPlayers() {
    const player1 = this.waitingPlayers.shift();
    const player2 = this.waitingPlayers.shift();

    const gameId = uuidv4();
    const game = this.createGame(gameId, player1, player2, false);

    return {
      status: 'matched',
      gameId,
      game,
      player1,
      player2
    };
  }

  startBotGame(socketId, username) {
    this.waitingPlayers = this.waitingPlayers.filter(p => p.username !== username);
    
    if (this.matchmakingTimeouts.has(username)) {
      clearTimeout(this.matchmakingTimeouts.get(username));
      this.matchmakingTimeouts.delete(username);
    }

    const gameId = uuidv4();
    const player1 = { socketId, username };
    const player2 = { socketId: 'BOT', username: 'BOT' };

    const game = this.createGame(gameId, player1, player2, true);

    return { gameId, game };
  }

  // GAME MANAGEMENT

  createGame(gameId, player1, player2, isAgainstBot) {
    const game = {
      gameId,
      board: GameLogic.createBoard(),
      players: {
        1: { socketId: player1.socketId, username: player1.username },
        2: { socketId: player2.socketId, username: player2.username }
      },
      currentPlayer: 1,
      status: 'active',
      winner: null,
      isAgainstBot,
      moves: [],
      startedAt: Date.now(),
      lastMoveAt: Date.now(),
      botTakeover: false
    };

    this.activeGames.set(gameId, game);
    this.playerToGame.set(player1.username, gameId);
    if (!isAgainstBot) {
      this.playerToGame.set(player2.username, gameId);
    }

    return game;
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  getGameByUsername(username) {
    const gameId = this.playerToGame.get(username);
    if (gameId) {
      return this.activeGames.get(gameId);
    }
    return null;
  }

  makeMove(gameId, column, playerNum) {
    const game = this.activeGames.get(gameId);
    if (!game) return { error: 'Game not found' };

    if (game.status !== 'active') {
      return { error: 'Game is not active' };
    }

    if (game.currentPlayer !== playerNum) {
      return { error: 'Not your turn' };
    }

    if (!GameLogic.isValidMove(game.board, column)) {
      return { error: 'Invalid move' };
    }

    const moveResult = GameLogic.makeMove(game.board, column, playerNum);
    if (!moveResult) {
      return { error: 'Invalid move - column is full' };
    }

    const { row, col } = moveResult;
    
    console.log(`Move: Player ${playerNum} (${game.players[playerNum].username}) -> Column ${column}, Row ${row}`);
    
    game.moves.push({
      player: game.players[playerNum].username,
      column,
      row,
      timestamp: new Date()
    });
    
    game.lastMoveAt = Date.now();

    GameLogic.printBoard(game.board, `After ${game.players[playerNum].username}'s move`);

    const isWinner = GameLogic.checkWinner(game.board, row, col, playerNum);
    
    if (isWinner) {
      console.log(`GAME OVER - Player ${playerNum} (${game.players[playerNum].username}) WINS!`);
      
      const allWins = GameLogic.findAllWins(game.board);
      if (allWins.length > 0) {
        console.log(`Win validation confirmed:`, allWins);
      } else {
        console.error(`WARNING: checkWinner returned true but findAllWins found no wins!`);
        GameLogic.printBoard(game.board, 'ERROR - No win found');
      }
      
      game.status = 'finished';
      game.winner = playerNum;
      return {
        success: true,
        row,
        col,
        gameOver: true,
        winner: game.players[playerNum].username,
        result: playerNum === 1 ? 'player1_win' : 'player2_win'
      };
    }

    if (GameLogic.isBoardFull(game.board)) {
      console.log('GAME OVER - Draw (board full)');
      game.status = 'finished';
      game.winner = null;
      return {
        success: true,
        row,
        col,
        gameOver: true,
        winner: null,
        result: 'draw'
      };
    }

    game.currentPlayer = playerNum === 1 ? 2 : 1;
    console.log(`Next turn: Player ${game.currentPlayer} (${game.players[game.currentPlayer].username})`);

    return {
      success: true,
      row,
      col,
      gameOver: false,
      nextPlayer: game.currentPlayer
    };
  }

  handleDisconnect(socketId, username) {
    this.waitingPlayers = this.waitingPlayers.filter(p => p.socketId !== socketId);
    
    if (this.matchmakingTimeouts.has(username)) {
      clearTimeout(this.matchmakingTimeouts.get(username));
      this.matchmakingTimeouts.delete(username);
    }

    const gameId = this.playerToGame.get(username);
    if (gameId) {
      const game = this.activeGames.get(gameId);
      if (game && game.status === 'active') {
        this.disconnectedPlayers.set(username, {
          gameId,
          disconnectedAt: Date.now()
        });

        return { gameId, game, wasInGame: true };
      }
    }

    return { wasInGame: false };
  }

  handleReconnect(socketId, username) {
    console.log(`Attempting to reconnect ${username} with socket ${socketId}`);
    
    // First check disconnectedPlayers
    const disconnectInfo = this.disconnectedPlayers.get(username);
    if (disconnectInfo) {
      console.log(`Found disconnect info for ${username}, gameId: ${disconnectInfo.gameId}`);
      const game = this.activeGames.get(disconnectInfo.gameId);
      if (game && game.status === 'active') {
        console.log(`Game ${disconnectInfo.gameId} is active, reconnecting player`);
        for (const playerNum of [1, 2]) {
          if (game.players[playerNum].username === username || 
              game[`originalPlayer${playerNum}`] === username) {
            if (game.players[playerNum].username !== 'BOT') {
              console.log(`Updating socket ID for player ${playerNum} from ${game.players[playerNum].socketId} to ${socketId}`);
              game.players[playerNum].socketId = socketId;
            }
            break;
          }
        }
        this.disconnectedPlayers.delete(username);
        return { gameId: disconnectInfo.gameId, game };
      } else {
        console.log(`Game ${disconnectInfo.gameId} is not active, clearing disconnect info`);
        this.disconnectedPlayers.delete(username);
      }
    }

    // Also check if player is already in a game (in case disconnect info was cleared)
    const gameId = this.playerToGame.get(username);
    if (gameId) {
      console.log(`Found gameId ${gameId} for ${username} in playerToGame`);
      const game = this.activeGames.get(gameId);
      if (game && game.status === 'active') {
        console.log(`Game ${gameId} is active, reconnecting player`);
        // Update socket ID for the player
        for (const playerNum of [1, 2]) {
          if (game.players[playerNum].username === username || 
              game[`originalPlayer${playerNum}`] === username) {
            if (game.players[playerNum].username !== 'BOT') {
              console.log(`Updating socket ID for player ${playerNum} from ${game.players[playerNum].socketId} to ${socketId}`);
              game.players[playerNum].socketId = socketId;
            }
            break;
          }
        }
        return { gameId, game };
      } else {
        console.log(`Game ${gameId} is not active, removing from playerToGame`);
        this.playerToGame.delete(username);
      }
    } else {
      console.log(`No gameId found for ${username} in playerToGame`);
    }

    console.log(`Reconnection failed for ${username}`);
    return null;
  }

  forfeitGame(gameId, disconnectedUsername) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return null;

    game.status = 'finished';

    let winnerNum;
    if (game.players[1].username === disconnectedUsername || game.originalPlayer1 === disconnectedUsername) {
      winnerNum = 2;
    } else {
      winnerNum = 1;
    }

    game.winner = winnerNum;

    return {
      gameId,
      winner: game.players[winnerNum].username,
      loser: disconnectedUsername,
      result: 'forfeit'
    };
  }

  endGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) return null;

    this.clearMoveTimer(gameId);
    
    this.playerTimeouts.delete(`${gameId}-1`);
    this.playerTimeouts.delete(`${gameId}-2`);

    game.duration = Math.floor((Date.now() - game.startedAt) / 1000);

    if (game.originalPlayer1) {
      this.playerToGame.delete(game.originalPlayer1);
    } else {
      this.playerToGame.delete(game.players[1].username);
    }
    
    if (!game.isAgainstBot) {
      if (game.originalPlayer2) {
        this.playerToGame.delete(game.originalPlayer2);
      } else if (game.players[2].username !== 'BOT') {
        this.playerToGame.delete(game.players[2].username);
      }
    }

    this.activeGames.delete(gameId);

    return game;
  }

  getPlayerNumber(gameId, username) {
    const game = this.activeGames.get(gameId);
    if (!game) return null;

    if (game.players[1].username === username) return 1;
    if (game.players[2].username === username) return 2;
    
    if (game.originalPlayer1 === username) return 1;
    if (game.originalPlayer2 === username) return 2;
    
    return null;
  }

  setMatchmakingTimeout(username, callback) {
    const timeout = setTimeout(callback, 10000);
    this.matchmakingTimeouts.set(username, timeout);
  }

  removeFromQueue(username) {
    this.waitingPlayers = this.waitingPlayers.filter(p => p.username !== username);
    
    if (this.matchmakingTimeouts.has(username)) {
      clearTimeout(this.matchmakingTimeouts.get(username));
      this.matchmakingTimeouts.delete(username);
    }
  }
}

const matchmakingService = new MatchmakingService();

module.exports = matchmakingService;
