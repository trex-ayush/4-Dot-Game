import React, { useState, useEffect } from 'react';
import Cell from './Cell';
import { COLS, ROWS } from '../constants/game';

const GameBoard = ({ board, onColumnClick, isMyTurn, currentPlayer, socket }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleTimerStarted = (data) => {
      if (data.player === currentPlayer) {
        setTimeLeft(data.timeLimit);
        setShowTimer(true);
      }
    };

    const handleMoveMade = () => {
      setShowTimer(false);
      setTimeLeft(30);
    };

    const handlePlayerTimeout = (data) => {
      setShowTimer(false);
    };

    socket.on('move_timer_started', handleTimerStarted);
    socket.on('move_made', handleMoveMade);
    socket.on('player_timeout', handlePlayerTimeout);

    return () => {
      socket.off('move_timer_started', handleTimerStarted);
      socket.off('move_made', handleMoveMade);
      socket.off('player_timeout', handlePlayerTimeout);
    };
  }, [socket, currentPlayer]);

  useEffect(() => {
    let interval;
    if (showTimer && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showTimer, timeLeft]);

  const handleColumnClick = (col) => {
    if (isMyTurn) {
      onColumnClick(col);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Timer Display */}
      {showTimer && (
        <div className={`text-center mb-2 ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
          <div className={`
            inline-block px-4 py-2 rounded-full font-bold
            ${timeLeft <= 10 ? 'bg-red-600' : 'bg-blue-600'}
          `}>
            ⏱️ Time Left: {timeLeft}s
          </div>
        </div>
      )}

      {/* Column indicators */}
      <div className="flex gap-2 justify-center mb-2">
        {Array.from({ length: COLS }).map((_, col) => (
          <div
            key={col}
            className={`
              w-16 h-8 flex items-center justify-center rounded-t-lg
              text-white font-bold text-lg
              ${isMyTurn ? 'bg-blue-600 cursor-pointer hover:bg-blue-500' : 'bg-gray-600'}
              transition-all
            `}
            onClick={() => handleColumnClick(col)}
          >
            ↓
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-board p-4 rounded-2xl shadow-2xl border-4 border-blue-800">
        <div className="flex flex-col gap-2">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  onClick={() => handleColumnClick(colIndex)}
                  isClickable={isMyTurn}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Turn indicator */}
      <div className="text-center mt-4">
        <div className={`
          inline-block px-6 py-3 rounded-full font-bold text-lg
          ${currentPlayer === 1 ? 'bg-red-600' : 'bg-yellow-600'}
          ${isMyTurn ? 'animate-pulse-slow' : ''}
        `}>
          {isMyTurn ? "Your Turn!" : "Opponent's Turn"}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;