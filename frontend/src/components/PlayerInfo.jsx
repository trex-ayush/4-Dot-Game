import React from 'react';

const PlayerInfo = ({ playerNumber, username, opponent, isAgainstBot, opponentDisconnected }) => {
  return (
    <div className="card space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Players</h2>
      
      {/* Player 1 */}
      <div className={`
        flex items-center justify-between p-4 rounded-lg
        ${playerNumber === 1 ? 'bg-red-600/30 ring-2 ring-red-500' : 'bg-slate-700/30'}
      `}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600"></div>
          <div>
            <p className="font-semibold">{playerNumber === 1 ? username : opponent}</p>
            <p className="text-xs text-gray-400">Player 1 (Red)</p>
          </div>
        </div>
        {playerNumber === 1 && (
          <span className="text-xs bg-blue-600 px-2 py-1 rounded">YOU</span>
        )}
      </div>

      {/* Player 2 */}
      <div className={`
        flex items-center justify-between p-4 rounded-lg
        ${playerNumber === 2 ? 'bg-yellow-600/30 ring-2 ring-yellow-500' : 'bg-slate-700/30'}
      `}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600"></div>
          <div>
            <p className="font-semibold">
              {playerNumber === 2 ? username : opponent}
              {isAgainstBot && ' 🤖'}
            </p>
            <p className="text-xs text-gray-400">Player 2 (Yellow)</p>
          </div>
        </div>
        {playerNumber === 2 && (
          <span className="text-xs bg-blue-600 px-2 py-1 rounded">YOU</span>
        )}
        {opponentDisconnected && playerNumber !== 2 && (
          <span className="text-xs bg-red-600 px-2 py-1 rounded animate-pulse">
            DISCONNECTED
          </span>
        )}
      </div>

      {opponentDisconnected && (
        <div className="bg-orange-600/20 border border-orange-500 rounded-lg p-3 text-sm">
          ⚠️ Opponent disconnected. Waiting for reconnection (30s)...
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;