import React, { useState, useEffect } from 'react';

const GameMenu = ({ username, onQuickMatch, onChallengeFriend, onViewLeaderboard, socket, onLogout }) => {
  const [showChallengeInput, setShowChallengeInput] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [error, setError] = useState('');
  const [pendingChallenges, setPendingChallenges] = useState({ received: [], sent: [] });

  useEffect(() => {
    if (!socket) return;

    // Request pending challenges
    socket.emit('get_pending_challenges', { username });

    // Listen for challenges
    const handleChallengeReceived = (data) => {
      setPendingChallenges(prev => ({
        ...prev,
        received: [...prev.received, data]
      }));
    };

    const handleChallengeSent = (data) => {
      setPendingChallenges(prev => ({
        ...prev,
        sent: [...prev.sent, data]
      }));
      setShowChallengeInput(false);
      setOpponentUsername('');
    };

    const handleChallengeResponse = (data) => {
      setPendingChallenges(prev => ({
        ...prev,
        sent: prev.sent.filter(c => c.challengeId !== data.challengeId)
      }));
    };

    const handlePendingChallenges = (data) => {
      setPendingChallenges(data);
    };

    socket.on('challenge_received', handleChallengeReceived);
    socket.on('challenge_sent', handleChallengeSent);
    socket.on('challenge_response', handleChallengeResponse);
    socket.on('pending_challenges', handlePendingChallenges);

    return () => {
      socket.off('challenge_received', handleChallengeReceived);
      socket.off('challenge_sent', handleChallengeSent);
      socket.off('challenge_response', handleChallengeResponse);
      socket.off('pending_challenges', handlePendingChallenges);
    };
  }, [socket, username]);

  const handleSendChallenge = () => {
    const trimmed = opponentUsername.trim();
    
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }

    if (trimmed.toLowerCase() === username.toLowerCase()) {
      setError('You cannot challenge yourself!');
      return;
    }

    setError('');
    socket.emit('send_challenge', {
      fromUsername: username,
      toUsername: trimmed.toLowerCase()
    });
  };

  const handleAcceptChallenge = (challengeId) => {
    socket.emit('accept_challenge', { challengeId, username });
  };

  const handleRejectChallenge = (challengeId) => {
    socket.emit('reject_challenge', { challengeId, username });
    setPendingChallenges(prev => ({
      ...prev,
      received: prev.received.filter(c => c.id !== challengeId)
    }));
  };

  const handleCancelChallenge = (challengeId) => {
    socket.emit('cancel_challenge', { challengeId, username });
    setPendingChallenges(prev => ({
      ...prev,
      sent: prev.sent.filter(c => c.challengeId !== challengeId)
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {username}! 👋</h1>
          <p className="text-gray-400">Choose your game mode</p>
        </div>

        {/* Pending Challenges Received */}
        {pendingChallenges.received.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🎯 Incoming Challenges ({pendingChallenges.received.length})
            </h3>
            <div className="space-y-2">
              {pendingChallenges.received.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold">{challenge.from}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(challenge.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptChallenge(challenge.id)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleRejectChallenge(challenge.id)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Challenges */}
        {pendingChallenges.sent.length > 0 && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500 rounded-lg">
            <h3 className="font-semibold mb-3">📤 Sent Challenges</h3>
            <div className="space-y-2">
              {pendingChallenges.sent.map((challenge) => (
                <div key={challenge.challengeId} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold">Waiting for {challenge.to}...</p>
                    <p className="text-xs text-gray-400">Challenge sent</p>
                  </div>
                  <button
                    onClick={() => handleCancelChallenge(challenge.challengeId)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Mode Options */}
        <div className="space-y-4 mb-6">
          {/* Quick Match */}
          <button
            onClick={onQuickMatch}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-6 rounded-xl text-left transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">⚡</div>
              <div>
                <h3 className="text-xl font-bold">Quick Match</h3>
                <p className="text-sm text-gray-300">Play against a random opponent or bot</p>
              </div>
            </div>
          </button>

          {/* Challenge Friend */}
          <div className="w-full bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl">
            <button
              onClick={() => setShowChallengeInput(!showChallengeInput)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h3 className="text-xl font-bold">Challenge a Friend</h3>
                  <p className="text-sm text-gray-300">Play against a specific player</p>
                </div>
              </div>
            </button>

            {showChallengeInput && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={opponentUsername}
                  onChange={(e) => setOpponentUsername(e.target.value)}
                  placeholder="Enter opponent's username..."
                  className="input-field"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChallenge()}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSendChallenge}
                    className="btn-primary flex-1"
                  >
                    Send Challenge
                  </button>
                  <button
                    onClick={() => {
                      setShowChallengeInput(false);
                      setOpponentUsername('');
                      setError('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onViewLeaderboard}
            className="btn-secondary"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={onLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;