import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGame } from './hooks/useGame';
import { GAME_STATUS } from './constants/game';
import { getStoredUsername, clearUsername } from './utils/localStorage';

import Lobby from './components/Lobby';
import GameMenu from './components/GameMenu';
import GameBoard from './components/GameBoard';
import PlayerInfo from './components/PlayerInfo';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [username, setUsername] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameMode, setGameMode] = useState(null);
  
  const { socket, isConnected, connect, disconnect, keepAlive } = useSocket();
  const {
    gameState,
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
    setGameState
  } = useGame(socket, username);

  // Connect socket when username is set and keep it connected
  useEffect(() => {
    if (username && !isConnected) {
      connect();
    }
  }, [username, isConnected, connect]);

  // Keep connection alive with periodic pings
  useEffect(() => {
    let keepAliveInterval;
    if (username && isConnected) {
      keepAliveInterval = setInterval(() => {
        if (keepAlive) keepAlive();
      }, 20000); // Every 20 seconds
    }
    return () => {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };
  }, [username, isConnected, keepAlive]);

  // Register user with socket when connected or reconnected
  useEffect(() => {
    if (!socket || !username) return;
    
    const handleConnect = () => {
      if (username) {
        console.log('Socket connected/reconnected, registering user:', username);
        socket.emit('register_user', { username });
      }
    };
    
    // Register on initial connection
    if (isConnected) {
      handleConnect();
    }
    
    // Also listen for future reconnections
    socket.on('connect', handleConnect);
    
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, isConnected, username]);

  const handleJoinQueue = (name) => {
    setUsername(name);
    setTimeout(() => {
      setGameState(GAME_STATUS.MENU);
    }, 200);
  };

  const handleQuickMatch = () => {
    setGameMode('quick_match');
    joinQueue();
  };

  const handlePlayAgain = () => {
    resetGame();
    setGameState(GAME_STATUS.MENU);
    setGameMode(null);
  };

  const handleBackToLobby = () => {
    resetGame();
    setUsername('');
    setGameMode(null);
    disconnect();
  };

  const handleBackToMenu = () => {
    if (socket && isConnected) {
      socket.emit('leave_queue');
    }
    resetGame();
    setGameState(GAME_STATUS.MENU);
    setGameMode(null);
  };

  const handleLogout = () => {
    clearUsername();
    handleBackToLobby();
  };

  const isMyTurn = playerNumber === currentPlayer;

  return (
    <div className="min-h-screen p-4">
      <ConnectionStatus isConnected={isConnected} />

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-drop">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
            ⚠️ {errorMessage}
          </div>
        </div>
      )}

      {/* Player Left Message (Prominent) */}
      {playerLeftMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-drop">
          <div className="bg-orange-600 text-white px-8 py-4 rounded-lg shadow-2xl text-lg font-semibold">
            ⏰ {playerLeftMessage}
          </div>
        </div>
      )}

      {/* Connection Status Indicator */}
      {username && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              {username[0].toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-white">{username}</p>
              <p className="text-xs text-gray-400">{isConnected ? 'Online' : 'Connecting...'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lobby Screen */}
      {gameState === GAME_STATUS.LOBBY && (
        <Lobby
          onJoin={handleJoinQueue}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Game Menu */}
      {gameState === GAME_STATUS.MENU && (
        <GameMenu
          username={username}
          socket={socket}
          isConnected={isConnected}
          onQuickMatch={handleQuickMatch}
          onChallengeFriend={() => {}}
          onViewLeaderboard={() => setShowLeaderboard(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Waiting Screen */}
      {gameState === GAME_STATUS.WAITING && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="card max-w-md w-full text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
            <h2 className="text-2xl font-bold">Finding Opponent...</h2>
            <p className="text-gray-400">
              Searching for a player to match with...
              <br />
              <span className="text-sm">If no one joins in 10s, you'll play against a bot</span>
            </p>
            <button onClick={handleBackToMenu} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game Screen */}
      {gameState === GAME_STATUS.PLAYING && (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">4 in a Row</h1>
            <p className="text-gray-400">
              Playing as: <span className="text-white font-semibold">{username}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="order-2 lg:order-1">
              <PlayerInfo
                playerNumber={playerNumber}
                username={username}
                opponent={opponent}
                isAgainstBot={isAgainstBot}
                opponentDisconnected={opponentDisconnected}
              />

              <div className="card mt-4">
                <h3 className="font-semibold mb-2">Game Info</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Mode: {isAgainstBot ? '🤖 vs Bot' : '👥 vs Player'}</p>
                  <p>Your Color: {playerNumber === 1 ? '🔴 Red' : '🟡 Yellow'}</p>
                  <p className="text-yellow-400">⏱️ 30 seconds per move</p>
                  {isAgainstBot && opponent === 'BOT' && (
                    <p className="text-orange-400 font-semibold">Bot has taken over!</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleBackToMenu}
                className="btn-secondary w-full mt-4"
              >
                Leave Game
              </button>
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2">
              <GameBoard
                board={board}
                onColumnClick={makeMove}
                isMyTurn={isMyTurn}
                currentPlayer={currentPlayer}
                socket={socket}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === GAME_STATUS.GAME_OVER && (
        <GameOver
          winner={winner}
          result={gameResult}
          playerNumber={playerNumber}
          username={username}
          board={board}
          finalMove={finalMove}
          onPlayAgain={handlePlayAgain}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          currentUsername={username}
        />
      )}
    </div>
  );
}

export default App;