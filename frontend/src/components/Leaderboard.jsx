import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';

const Leaderboard = ({ onClose, currentUsername }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard(20);
      setLeaderboardData(response.data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                <tr className="text-left">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Losses</th>
                  <th className="py-3 px-4 text-center">Draws</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player) => (
                  <tr
                    key={player.username}
                    className={`
                      border-b border-slate-700 hover:bg-slate-700/30 transition-colors
                      ${player.username === currentUsername?.toLowerCase() ? 'bg-blue-600/20' : ''}
                    `}
                  >
                    <td className="py-3 px-4">
                      <span className={`
                        font-bold
                        ${player.rank === 1 ? 'text-yellow-400 text-xl' : ''}
                        ${player.rank === 2 ? 'text-gray-300 text-lg' : ''}
                        ${player.rank === 3 ? 'text-orange-400 text-lg' : ''}
                      `}>
                        {player.rank === 1 && '🥇'}
                        {player.rank === 2 && '🥈'}
                        {player.rank === 3 && '🥉'}
                        {player.rank > 3 && `#${player.rank}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {player.username}
                      {player.username === currentUsername?.toLowerCase() && (
                        <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">YOU</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-green-400 font-semibold">
                      {player.wins}
                    </td>
                    <td className="py-3 px-4 text-center text-red-400">
                      {player.losses}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">
                      {player.draws}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {player.winRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {leaderboardData.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No players yet. Be the first to play!
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700">
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;