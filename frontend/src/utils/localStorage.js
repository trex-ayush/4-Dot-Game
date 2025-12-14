const USERNAME_KEY = 'four_in_a_row_username';

export const saveUsername = (username) => {
  try {
    localStorage.setItem(USERNAME_KEY, username.toLowerCase());
  } catch (error) {
    console.error('Error saving username:', error);
  }
};

export const getStoredUsername = () => {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
};

export const clearUsername = () => {
  try {
    localStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    console.error('Error clearing username:', error);
  }
};