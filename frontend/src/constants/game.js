export const ROWS = 6;
export const COLS = 7;
export const PLAYER_1 = 1;
export const PLAYER_2 = 2;
export const EMPTY = null;

export const GAME_STATUS = {
  LOBBY: 'lobby',
  MENU: 'menu', // NEW - After login, choose game mode
  WAITING: 'waiting',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  RECONNECTING: 'reconnecting'
};

export const GAME_MODE = {
  QUICK_MATCH: 'quick_match',
  CHALLENGE: 'challenge',
  VS_BOT: 'vs_bot'
};

export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_QUEUE: 'join_queue',
  LEAVE_QUEUE: 'leave_queue',
  MAKE_MOVE: 'make_move',
  SEND_MESSAGE: 'send_message',
  SEND_CHALLENGE: 'send_challenge',
  ACCEPT_CHALLENGE: 'accept_challenge',
  REJECT_CHALLENGE: 'reject_challenge',
  CANCEL_CHALLENGE: 'cancel_challenge',
  GET_PENDING_CHALLENGES: 'get_pending_challenges',

  // Server to Client
  WAITING_FOR_OPPONENT: 'waiting_for_opponent',
  GAME_STARTED: 'game_started',
  PLAYER_ASSIGNED: 'player_assigned',
  MOVE_MADE: 'move_made',
  GAME_OVER: 'game_over',
  OPPONENT_DISCONNECTED: 'opponent_disconnected',
  OPPONENT_RECONNECTED: 'opponent_reconnected',
  GAME_RECONNECTED: 'game_reconnected',
  LEFT_QUEUE: 'left_queue',
  ERROR: 'error',
  CHALLENGE_SENT: 'challenge_sent',
  CHALLENGE_RECEIVED: 'challenge_received',
  CHALLENGE_REJECTED: 'challenge_rejected',
  CHALLENGE_CANCELLED: 'challenge_cancelled',
  CHALLENGE_RESPONSE: 'challenge_response',
  PENDING_CHALLENGES: 'pending_challenges'
};