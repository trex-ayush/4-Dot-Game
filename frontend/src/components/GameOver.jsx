import React, { useState } from 'react';

const GameOver = ({ winner, result, playerNumber, username, board, finalMove, onPlayAgain, onViewLeaderboard }) => {
  const [showBoard, setShowBoard] = useState(true);

  const getResultMessage = () => {
    if (result === 'draw') {
      return {
        title: "It's a Draw! 🤝",
        message: "The board is full. Well played!",
        color: 'text-gray-400'
      };
    }

    if (result === 'forfeit') {
      return {
        title: winner === username ? "You Win! 🎉" : "Opponent Forfeited",
        message: "Opponent disconnected",
        color: winner === username ? 'text-green-400' : 'text-orange-400'
      };
    }

    const didIWin = winner === username;
    
    return {
      title: didIWin ? "You Win! 🎉" : "You Lose 😢",
      message: didIWin ? "Congratulations! Great game!" : "Better luck next time!",
      color: didIWin ? 'text-green-400' : 'text-red-400'
    };
  };

  const resultData = getResultMessage();

  const getCellClass = (value, row, col) => {
    let baseClass = "w-12 h-12 rounded-full border-2 border-slate-600 ";
    
    // Highlight final move
    if (finalMove && finalMove.row === row && finalMove.col === col) {
      baseClass += "ring-4 ring-yellow-400 animate-pulse ";
    }
    
    if (value === 1) return baseClass + "bg-gradient-to-br from-red-400 to-red-600";
    if (value === 2) return baseClass + "bg-gradient-to-br from-yellow-400 to-yellow-600";
    return baseClass + "bg-slate-900/50";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-4xl w-full text-center space-y-6 animate-drop my-8">
        <h2 className={`text-4xl font-bold ${resultData.color}`}>
          {resultData.title}
        </h2>
        
        <p className="text-xl text-gray-300">
          {resultData.message}
        </p>

        {winner && (
          <div className="flex items-center justify-center gap-3 p-4 bg-slate-700/50 rounded-lg">
            <div className={`
              w-10 h-10 rounded-full
              ${winner === username 
                ? (playerNumber === 1 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-yellow-400 to-yellow-600')
                : (playerNumber === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-red-400 to-red-600')
              }
            `}></div>
            <p className="text-2xl font-bold">{winner} Won!</p>
          </div>
        )}

        {/* Final Board State */}
        {showBoard && board && (
          <div className="bg-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Final Game State</h3>
              {finalMove && (
                <p className="text-sm text-yellow-400">
                  ⭐ Last move highlighted
                </p>
              )}
            </div>
            <div className="inline-block bg-blue-900 p-3 rounded-lg">
              <div className="flex flex-col gap-1">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={getCellClass(cell, rowIndex, colIndex)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowBoard(false)}
              className="mt-3 text-sm text-gray-400 hover:text-white"
            >
              Hide Board
            </button>
          </div>
        )}

        {!showBoard && (
          <button
            onClick={() => setShowBoard(true)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Show Final Board
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="btn-primary flex-1"
          >
            Play Again
          </button>
          <button
            onClick={onViewLeaderboard}
            className="btn-secondary flex-1"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;