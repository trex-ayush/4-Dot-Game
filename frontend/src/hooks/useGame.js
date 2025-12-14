import { useState, useCallback, useEffect } from 'react';
import { GAME_STATUS, SOCKET_EVENTS, ROWS, COLS } from '../constants/game';

export const useGame = (socket, username) => {
  const [gameState, setGameState] = useState(GAME_STATUS.LOBBY);
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [isAgainstBot, setIsAgainstBot] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [finalMove, setFinalMove] = useState(null);
  const [playerLeftMessage, setPlayerLeftMessage] = useState(null);

  // Reset game state
  const resetGame = useCallback(() => {
    setGameState(GAME_STATUS.LOBBY);
    setGameId(null);
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPlayer(1);
    setPlayerNumber(null);
    setOpponent(null);
    setIsAgainstBot(false);
    setWinner(null);
    setGameResult(null);
    setErrorMessage(null);
    setOpponentDisconnected(false);
    setFinalMove(null);
    setPlayerLeftMessage(null);
  }, []);

  // Join matchmaking queue
  const joinQueue = useCallback(() => {
    if (socket && socket.connected && username) {
      socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { username });
      setGameState(GAME_STATUS.WAITING);
    }
  }, [socket, username]);

  // Leave matchmaking queue
  const leaveQueue = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
      resetGame();
    }
  }, [socket, resetGame]);

  // Make a move
  const makeMove = useCallback((column) => {
    if (socket && socket.connected && gameId) {
      if (playerNumber !== currentPlayer) {
        setErrorMessage('Not your turn!');
        setTimeout(() => setErrorMessage(null), 2000);
        return false;
      }

      socket.emit(SOCKET_EVENTS.MAKE_MOVE, { gameId, column });
      return true;
    }
    return false;
  }, [socket, gameId, playerNumber, currentPlayer]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Waiting for opponent
    const handleWaiting = () => {
      setGameState(GAME_STATUS.WAITING);
    };

    // Game started
    const handleGameStarted = (data) => {
      setGameId(data.gameId);
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setIsAgainstBot(data.isAgainstBot);
      setGameState(GAME_STATUS.PLAYING);
      setOpponentDisconnected(false);
      setFinalMove(null);
      setPlayerLeftMessage(null);
      
      const opponentName = data.players[1] === username ? data.players[2] : data.players[1];
      setOpponent(opponentName);
    };

    // Player number assigned
    const handlePlayerAssigned = (data) => {
      setPlayerNumber(data.playerNumber);
    };

    // Move made
    const handleMoveMade = (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setErrorMessage(null);
    };

    // Game over
    const handleGameOver = (data) => {
      setBoard(data.board);
      setWinner(data.winner);
      setGameResult(data.result);
      setFinalMove(data.finalMove || null);
      setGameState(GAME_STATUS.GAME_OVER);
    };

    // Opponent disconnected
    const handleOpponentDisconnected = () => {
      setOpponentDisconnected(true);
      setErrorMessage('Opponent disconnected. Waiting for reconnection...');
    };

    // Opponent reconnected
    const handleOpponentReconnected = () => {
      setOpponentDisconnected(false);
      setErrorMessage('Opponent reconnected!');
      setTimeout(() => setErrorMessage(null), 3000);
    };

    // Game reconnected
    const handleGameReconnected = (data) => {
      console.log('Game reconnected:', data);
      setGameId(data.gameId);
      setBoard(data.game.board);
      setCurrentPlayer(data.game.currentPlayer);
      setPlayerNumber(data.playerNumber);
      setIsAgainstBot(data.game.isAgainstBot);
      setGameState(GAME_STATUS.PLAYING);
      setFinalMove(null);
      setOpponentDisconnected(false);
      setErrorMessage(null);
      
      const opponentName = data.game.players[1].username === username 
        ? data.game.players[2].username 
        : data.game.players[1].username;
      setOpponent(opponentName);
    };

    // Error
    const handleError = (data) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 3000);
    };

    // Left queue
    const handleLeftQueue = () => {
      resetGame();
    };

    // Player timeout (OLD)
    const handlePlayerTimeout = (data) => {
      setErrorMessage(`${data.username} timed out! Bot is taking over.`);
      if (data.username === opponent) {
        setOpponent('BOT (timeout)');
        setIsAgainstBot(true);
      }
    };

    // Player left due to timeout (NEW)
    const handlePlayerLeftTimeout = (data) => {
      console.log('Player left due to timeout:', data);
      
      // Show prominent message
      setPlayerLeftMessage(data.message);
      setTimeout(() => setPlayerLeftMessage(null), 5000);
      
      // Update opponent info if it was the opponent who left
      if (data.username === opponent || 
          (playerNumber === 1 && data.timedOutPlayer === 2) ||
          (playerNumber === 2 && data.timedOutPlayer === 1)) {
        setOpponent('BOT');
        setIsAgainstBot(true);
      }
    };

    // Move timer started
    const handleMoveTimerStarted = (data) => {
      // This is handled in GameBoard component
    };

    // Register event listeners
    socket.on(SOCKET_EVENTS.WAITING_FOR_OPPONENT, handleWaiting);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
    socket.on(SOCKET_EVENTS.PLAYER_ASSIGNED, handlePlayerAssigned);
    socket.on(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
    socket.on(SOCKET_EVENTS.GAME_OVER, handleGameOver);
    socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
    socket.on(SOCKET_EVENTS.OPPONENT_RECONNECTED, handleOpponentReconnected);
    socket.on(SOCKET_EVENTS.GAME_RECONNECTED, handleGameReconnected);
    socket.on(SOCKET_EVENTS.ERROR, handleError);
    socket.on(SOCKET_EVENTS.LEFT_QUEUE, handleLeftQueue);
    socket.on('player_timeout', handlePlayerTimeout);
    socket.on('player_left_timeout', handlePlayerLeftTimeout);
    socket.on('move_timer_started', handleMoveTimerStarted);

    // Cleanup
    return () => {
      socket.off(SOCKET_EVENTS.WAITING_FOR_OPPONENT, handleWaiting);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
      socket.off(SOCKET_EVENTS.PLAYER_ASSIGNED, handlePlayerAssigned);
      socket.off(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
      socket.off(SOCKET_EVENTS.GAME_OVER, handleGameOver);
      socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
      socket.off(SOCKET_EVENTS.OPPONENT_RECONNECTED, handleOpponentReconnected);
      socket.off(SOCKET_EVENTS.GAME_RECONNECTED, handleGameReconnected);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
      socket.off(SOCKET_EVENTS.LEFT_QUEUE, handleLeftQueue);
      socket.off('player_timeout', handlePlayerTimeout);
      socket.off('player_left_timeout', handlePlayerLeftTimeout);
      socket.off('move_timer_started', handleMoveTimerStarted);
    };
  }, [socket, username, opponent, playerNumber, resetGame]);

  return {
    gameState,
    setGameState,
    gameId,
    board,
    currentPlayer,
    playerNumber,
    opponent,
    isAgainstBot,
    winner,
    gameResult,
    errorMessage,
    opponentDisconnected,
    finalMove,
    playerLeftMessage,
    joinQueue,
    leaveQueue,
    makeMove,
    resetGame,
  };
};