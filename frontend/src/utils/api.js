import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== AUTH APIs ==========

export const checkUsername = async (username) => {
  try {
    const response = await api.get(`/auth/check/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

export const registerOrLogin = async (username) => {
  try {
    const response = await api.post('/auth/login', { username });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const getUserProfile = async (username) => {
  try {
    const response = await api.get(`/auth/profile/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// ========== LEADERBOARD APIs ==========

export const getLeaderboard = async (limit = 10, sortBy = 'wins') => {
  try {
    const response = await api.get(`/leaderboard?limit=${limit}&sortBy=${sortBy}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export const getPlayerRank = async (username) => {
  try {
    const response = await api.get(`/leaderboard/rank/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player rank:', error);
    throw error;
  }
};

// ========== GAME APIs ==========

export const getUserStats = async (username) => {
  try {
    const response = await api.get(`/game/stats/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

export const getGameHistory = async (username) => {
  try {
    const response = await api.get(`/game/history/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game history:', error);
    throw error;
  }
};

export default api;