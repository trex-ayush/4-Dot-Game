const matchmakingService = require('../services/matchmakingService');
const BotService = require('../services/botService');
const gameController = require('../controllers/gameController');

const initializeGameSocket = (io) => {
  const socketToUser = new Map();
  const userToSocket = new Map();

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // HEARTBEAT
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // USER REGISTRATION
    socket.on('register_user', ({ username }) => {
      console.log(`Registering user: ${username} with socket ${socket.id}`);
      
      const normalizedUsername = username.toLowerCase().trim();
      
      socketToUser.set(socket.id, normalizedUsername);
      
      const oldSocketId = userToSocket.get(normalizedUsername);
      if (oldSocketId && oldSocketId !== socket.id) {
        socketToUser.delete(oldSocketId);
      }
      
      userToSocket.set(normalizedUsername, socket.id);
      
      // Check if user was in a game and reconnect them
      const reconnectResult = matchmakingService.handleReconnect(socket.id, normalizedUsername);
      if (reconnectResult) {
        const { gameId, game } = reconnectResult;
        socket.join(gameId);
        
        const playerNumber = matchmakingService.getPlayerNumber(gameId, normalizedUsername);
        
        socket.emit('game_reconnected', {
          gameId,
          game,
          playerNumber
        });
        
        // Notify opponent if they're still connected
        const opponentUsername = game.players[1].username === normalizedUsername 
          ? game.players[2].username 
          : game.players[1].username;
        const opponentSocketId = userToSocket.get(opponentUsername);
        if (opponentSocketId && opponentUsername !== 'BOT' && !opponentUsername.includes('BOT')) {
          io.to(gameId).emit('opponent_reconnected', {
            username: normalizedUsername
          });
        }
      }
      
      socket.emit('user_registered', { username: normalizedUsername });
      socket.emit('get_pending_challenges', { username: normalizedUsername });
    });

    // CHALLENGE SYSTEM
    socket.on('send_challenge', async ({ fromUsername, toUsername }) => {
      console.log(`${fromUsername} challenging ${toUsername}`);
      
      const normalizedFrom = fromUsername.toLowerCase().trim();
      socketToUser.set(socket.id, normalizedFrom);
      userToSocket.set(normalizedFrom, socket.id);
      
      const result = matchmakingService.sendChallenge(
        normalizedFrom,
        toUsername.toLowerCase().trim(),
        socket.id
      );

      if (result.error) {
        console.log(`Challenge error: ${result.error}`);
        socket.emit('error', { message: result.error });
        return;
      }

      socket.emit('challenge_sent', {
        challengeId: result.challengeId,
        to: toUsername.toLowerCase()
      });

      const recipientSocketId = userToSocket.get(toUsername.toLowerCase().trim());
      if (recipientSocketId) {
        const recipientSocket = io.sockets.sockets.get(recipientSocketId);
        if (recipientSocket) {
          recipientSocket.emit('challenge_received', {
            challengeId: result.challengeId,
            id: result.challengeId,
            from: normalizedFrom,
            createdAt: result.challenge.createdAt
          });
        }
      }
    });

    socket.on('accept_challenge', async ({ challengeId, username }) => {
      console.log(`${username} accepting challenge ${challengeId}`);
      
      const normalizedUsername = username.toLowerCase().trim();
      
      socketToUser.set(socket.id, normalizedUsername);
      userToSocket.set(normalizedUsername, socket.id);
      
      const challenge = matchmakingService.activeChallenges.get(challengeId);
      if (!challenge) {
        socket.emit('error', { message: 'Challenge not found or expired' });
        return;
      }

      const challengerSocketId = userToSocket.get(challenge.from);
      if (challengerSocketId) {
        challenge.fromSocketId = challengerSocketId;
      }
      
      const result = matchmakingService.acceptChallenge(
        challengeId,
        normalizedUsername,
        socket.id
      );

      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      const { gameId, game, player1, player2 } = result;

      const socket1 = io.sockets.sockets.get(player1.socketId);
      const socket2 = io.sockets.sockets.get(player2.socketId);

      if (socket1) socket1.join(gameId);
      if (socket2) socket2.join(gameId);

      io.to(gameId).emit('game_started', {
        gameId,
        board: game.board,
        players: {
          1: player1.username,
          2: player2.username
        },
        currentPlayer: 1,
        isAgainstBot: false,
        mode: 'challenge'
      });

      matchmakingService.startMoveTimer(gameId, 1, io);

      if (socket1) socket1.emit('player_assigned', { playerNumber: 1, username: player1.username });
      if (socket2) socket2.emit('player_assigned', { playerNumber: 2, username: player2.username });
    });

    socket.on('reject_challenge', ({ challengeId, username }) => {
      const result = matchmakingService.rejectChallenge(challengeId, username.toLowerCase());

      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.emit('challenge_rejected', { challengeId });
    });

    socket.on('cancel_challenge', ({ challengeId, username }) => {
      const result = matchmakingService.cancelChallenge(challengeId, username.toLowerCase());

      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.emit('challenge_cancelled', { challengeId });
    });

    socket.on('get_pending_challenges', ({ username }) => {
      const normalizedUsername = username.toLowerCase().trim();
      const pending = matchmakingService.getPendingChallenges(normalizedUsername);
      const sent = matchmakingService.getSentChallenges(normalizedUsername);
      
      socket.emit('pending_challenges', { received: pending, sent });
    });

    // QUICK MATCH
    socket.on('join_queue', async ({ username }) => {
      const normalizedUsername = username.toLowerCase().trim();
      socketToUser.set(socket.id, normalizedUsername);
      userToSocket.set(normalizedUsername, socket.id);

      // Check for reconnection first
      const reconnectResult = matchmakingService.handleReconnect(socket.id, normalizedUsername);
      if (reconnectResult) {
        const { gameId, game } = reconnectResult;
        socket.join(gameId);
        
        const playerNumber = matchmakingService.getPlayerNumber(gameId, normalizedUsername);
        
        socket.emit('game_reconnected', {
          gameId,
          game,
          playerNumber
        });
        
        io.to(gameId).emit('opponent_reconnected', {
          username: normalizedUsername
        });
        
        return;
      }

      const result = matchmakingService.addToQueue(socket.id, normalizedUsername);

      // Handle reconnection from addToQueue
      if (result.status === 'reconnect') {
        const { gameId, game } = result;
        socket.join(gameId);
        
        const playerNumber = matchmakingService.getPlayerNumber(gameId, normalizedUsername);
        
        socket.emit('game_reconnected', {
          gameId,
          game,
          playerNumber
        });
        
        // Notify opponent if they're still connected
        const opponentUsername = game.players[1].username === normalizedUsername 
          ? game.players[2].username 
          : game.players[1].username;
        const opponentSocketId = userToSocket.get(opponentUsername);
        if (opponentSocketId && opponentUsername !== 'BOT' && !opponentUsername.includes('BOT')) {
          io.to(gameId).emit('opponent_reconnected', {
            username: normalizedUsername
          });
        }
        
        return;
      }

      if (result.status === 'matched') {
        const { gameId, game, player1, player2 } = result;

        const socket1 = io.sockets.sockets.get(player1.socketId);
        const socket2 = io.sockets.sockets.get(player2.socketId);

        if (socket1) socket1.join(gameId);
        if (socket2) socket2.join(gameId);

        io.to(gameId).emit('game_started', {
          gameId,
          board: game.board,
          players: {
            1: player1.username,
            2: player2.username
          },
          currentPlayer: 1,
          isAgainstBot: false,
          mode: 'quick_match'
        });

        matchmakingService.startMoveTimer(gameId, 1, io);
        
        if (socket1) socket1.emit('player_assigned', { playerNumber: 1, username: player1.username });
        if (socket2) socket2.emit('player_assigned', { playerNumber: 2, username: player2.username });
      } else if (result.status === 'waiting') {
        // Set 10-second timeout to start bot game
        socket.emit('waiting_for_opponent', { position: result.position });
        
        matchmakingService.setMatchmakingTimeout(normalizedUsername, () => {
          // Check if player is still waiting
          const stillWaiting = matchmakingService.waitingPlayers.find(p => p.username === normalizedUsername);
          if (!stillWaiting) return; // Player already matched or left
          
          console.log(`10s timeout: Starting bot game for ${normalizedUsername}`);
          
          const botGameResult = matchmakingService.startBotGame(socket.id, normalizedUsername);
          const { gameId, game } = botGameResult;
          
          socket.join(gameId);
          
          socket.emit('game_started', {
            gameId,
            board: game.board,
            players: {
              1: game.players[1].username,
              2: game.players[2].username
            },
            currentPlayer: 1,
            isAgainstBot: true,
            mode: 'vs_bot'
          });
          
          socket.emit('player_assigned', { playerNumber: 1, username: game.players[1].username });
          
          matchmakingService.startMoveTimer(gameId, 1, io);
        });
      }
    });

    // LEAVE QUEUE
    socket.on('leave_queue', (data) => {
      const username = data?.username || socketToUser.get(socket.id);
      if (username) {
        const normalizedUsername = username.toLowerCase().trim();
        matchmakingService.removeFromQueue(normalizedUsername);
        socket.emit('left_queue');
      }
    });

    // GAME MOVES
    socket.on('make_move', async ({ gameId, column }) => {
      const username = socketToUser.get(socket.id);
      if (!username) {
        socket.emit('error', { message: 'User not registered' });
        return;
      }

      const playerNumber = matchmakingService.getPlayerNumber(gameId, username);
      if (!playerNumber) {
        socket.emit('error', { message: 'You are not part of this game' });
        return;
      }

      const result = matchmakingService.makeMove(gameId, column, playerNumber);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      matchmakingService.clearMoveTimer(gameId);

      const game = matchmakingService.getGame(gameId);

      io.to(gameId).emit('move_made', {
        column,
        row: result.row,
        player: playerNumber,
        username,
        board: game.board,
        currentPlayer: result.nextPlayer
      });

      // Check if game is over
      if (result.gameOver) {
        // Set result on game object before saving
        game.result = result.result;
        
        // Save game to database
        try {
          await gameController.saveCompletedGame(game, result);
        } catch (error) {
          console.error('Error saving game:', error);
        }
        
        io.to(gameId).emit('game_over', {
          winner: result.winner,
          result: result.result,
          board: game.board,
          finalMove: { row: result.row, col: column }
        });
        
        matchmakingService.endGame(gameId);
      } else {
        // Start timer for next player
        const nextPlayerUsername = game.players[result.nextPlayer].username;
        if (nextPlayerUsername === 'BOT' || nextPlayerUsername.includes('BOT')) {
          // Bot's turn
          matchmakingService.makeBotMove(gameId, result.nextPlayer, io);
        } else {
          matchmakingService.startMoveTimer(gameId, result.nextPlayer, io);
        }
      }
    });

    // DISCONNECT HANDLING
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      
      const username = socketToUser.get(socket.id);
      if (!username) return;

      const disconnectResult = matchmakingService.handleDisconnect(socket.id, username);
      
      // If player was in a game, set up 30-second reconnection window
      if (disconnectResult.wasInGame) {
        const { gameId, game } = disconnectResult;
        
        // Notify opponent
        io.to(gameId).emit('opponent_disconnected', {
          username,
          gameId
        });
        
        // Set 30-second timeout for forfeit
        setTimeout(async () => {
          const stillDisconnected = matchmakingService.disconnectedPlayers.has(username);
          if (stillDisconnected) {
            console.log(`30s timeout: Forfeiting game for ${username}`);
            
            const forfeitResult = matchmakingService.forfeitGame(gameId, username);
            if (forfeitResult) {
              const game = matchmakingService.getGame(gameId);
              if (game) {
                // Set result on game object before saving
                game.result = 'forfeit';
                
                // Save game to database
                try {
                  await gameController.saveCompletedGame(game, { result: 'forfeit' });
                } catch (error) {
                  console.error('Error saving forfeited game:', error);
                }
              }
              
              io.to(gameId).emit('game_over', {
                winner: forfeitResult.winner,
                result: 'forfeit',
                board: game ? game.board : null,
                message: `${forfeitResult.loser} disconnected and forfeited`
              });
              
              matchmakingService.endGame(gameId);
            }
          }
        }, 30000); // 30 seconds
      }

      socketToUser.delete(socket.id);
      if (userToSocket.get(username) === socket.id) {
        userToSocket.delete(username);
      }
    });

    // CHAT
    socket.on('send_message', ({ gameId, message }) => {
      const username = socketToUser.get(socket.id);
      if (username) {
        io.to(gameId).emit('chat_message', {
          username,
          message,
          timestamp: new Date()
        });
      }
    });
  });
};

module.exports = initializeGameSocket;
