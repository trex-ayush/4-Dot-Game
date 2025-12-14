import React, { useState, useEffect } from 'react';
import { registerOrLogin, checkUsername } from '../utils/api';
import { saveUsername, getStoredUsername, clearUsername } from '../utils/localStorage';

const Lobby = ({ onJoin, onViewLeaderboard }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);

  // Check for stored username on mount
  useEffect(() => {
    const stored = getStoredUsername();
    if (stored) {
      setStoredUser(stored);
    }
  }, []);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingAvailability(true);
        const response = await checkUsername(username);
        setIsAvailable(response.available);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Register or login
      const response = await registerOrLogin(trimmedUsername);
      
      if (response.success) {
        // Save to localStorage
        saveUsername(trimmedUsername);
        
        // Show welcome message
        const message = response.isNewUser 
          ? '🎉 Account created! Starting game...' 
          : '👋 Welcome back!';
        
        console.log(message);
        
        // Start game
        onJoin(trimmedUsername);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsStored = async () => {
    try {
      setLoading(true);
      
      // Verify user still exists and update last login
      const response = await registerOrLogin(storedUser);
      
      if (response.success) {
        onJoin(storedUser);
      }
    } catch (err) {
      // User might have been deleted, clear localStorage
      clearUsername();
      setStoredUser(null);
      setError('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    clearUsername();
    setStoredUser(null);
    setUsername('');
    setError('');
  };

  const getUsernameInputClass = () => {
    if (!username || username.length < 3) return 'input-field';
    if (checkingAvailability) return 'input-field border-yellow-500';
    if (isAvailable === true) return 'input-field border-green-500';
    if (isAvailable === false) return 'input-field border-red-500';
    return 'input-field';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            4 in a Row
          </h1>
          <p className="text-gray-400">Connect Four • Real-time Multiplayer</p>
        </div>

        {/* Continue with stored username */}
        {storedUser && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500 rounded-lg">
            <p className="text-sm text-gray-300 mb-3">Welcome back!</p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {storedUser[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{storedUser}</p>
                  <p className="text-xs text-gray-400">Returning player</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleContinueAsStored}
              disabled={loading}
              className="btn-primary w-full mb-2"
            >
              {loading ? 'Loading...' : '🎮 Continue Playing'}
            </button>
            <button
              onClick={handleSwitchAccount}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              Switch Account
            </button>
          </div>
        )}

        {/* Login/Register form */}
        {!storedUser && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Choose Your Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username..."
                    className={getUsernameInputClass()}
                    autoFocus
                    disabled={loading}
                  />
                  {checkingAvailability && username.length >= 3 && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!checkingAvailability && isAvailable === true && username.length >= 3 && (
                    <div className="absolute right-3 top-3 text-green-500 text-xl">✓</div>
                  )}
                  {!checkingAvailability && isAvailable === false && username.length >= 3 && (
                    <div className="absolute right-3 top-3 text-red-500 text-xl">✗</div>
                  )}
                </div>
                
                {username.length >= 3 && !checkingAvailability && (
                  <p className={`mt-2 text-sm ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {isAvailable 
                      ? '✓ Username available - New account will be created' 
                      : '✗ Username taken - You will login to existing account'}
                  </p>
                )}
                
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={loading || checkingAvailability || (username.length >= 3 && isAvailable === null)}
              >
                {loading ? 'Please wait...' : (isAvailable ? '🎮 Create & Play' : '🎮 Login & Play')}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-400">
              <p>
                {isAvailable === false 
                  ? '💡 This username exists. Continuing will login to that account.'
                  : '💡 Your username will be saved for next time'}
              </p>
            </div>
          </>
        )}

        <div className="mt-6">
          <button
            onClick={onViewLeaderboard}
            className="btn-secondary w-full"
            disabled={loading}
          >
            🏆 View Leaderboard
          </button>
        </div>

        <div className="mt-8 p-4 bg-slate-700/30 rounded-lg space-y-2 text-sm text-gray-400">
          <p className="font-semibold text-white mb-2">How to Play:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Choose a unique username to track your stats</li>
            <li>Click a column to drop your disc</li>
            <li>Connect 4 discs in a row to win</li>
            <li>Play against another player or bot</li>
            <li>If no player joins in 10s, you'll face a bot</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;