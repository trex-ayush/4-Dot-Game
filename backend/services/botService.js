const GameLogic = require('./gameLogic');

const ROWS = 6;
const COLS = 7;
const BOT_PLAYER = 2;
const HUMAN_PLAYER = 1;

class BotService {
  // Main function to get bot's move
  static getBestMove(board) {
    console.log('\nBot is thinking...');
    GameLogic.printBoard(board, 'Bot analyzing position');
    
    // Priority 1: Check if bot can win immediately
    const winningMove = this.findWinningMove(board, BOT_PLAYER);
    if (winningMove !== -1) {
      console.log(`Bot found winning move: Column ${winningMove}`);
      return winningMove;
    }

    // Priority 2: Block opponent's winning move
    const blockingMove = this.findWinningMove(board, HUMAN_PLAYER);
    if (blockingMove !== -1) {
      console.log(`Bot blocking opponent's win: Column ${blockingMove}`);
      return blockingMove;
    }

    // Priority 3: Use Minimax with alpha-beta pruning
    const bestMove = this.minimax(board, 5, -Infinity, Infinity, true);
    console.log(`Bot chose strategic move: Column ${bestMove.column} (score: ${bestMove.score})`);
    return bestMove.column;
  }

  // Find immediate winning move for a player
  static findWinningMove(board, player) {
    const validMoves = GameLogic.getValidMoves(board);

    for (const col of validMoves) {
      const testBoard = GameLogic.cloneBoard(board);
      const row = GameLogic.getNextRow(testBoard, col);
      
      if (row === -1) continue;
      
      testBoard[row][col] = player;

      // Use the FIXED checkWinner function
      if (GameLogic.checkWinner(testBoard, row, col, player)) {
        return col;
      }
    }

    return -1;
  }

  // Minimax algorithm with alpha-beta pruning
  static minimax(board, depth, alpha, beta, isMaximizing) {
    const validMoves = GameLogic.getValidMoves(board);

    // Terminal conditions
    if (depth === 0 || validMoves.length === 0) {
      return { score: this.evaluateBoard(board), column: -1 };
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      let bestColumn = validMoves[Math.floor(Math.random() * validMoves.length)];

      for (const col of validMoves) {
        const testBoard = GameLogic.cloneBoard(board);
        const row = GameLogic.getNextRow(testBoard, col);
        
        if (row === -1) continue;
        
        testBoard[row][col] = BOT_PLAYER;

        // Check for immediate win using FIXED checkWinner
        if (GameLogic.checkWinner(testBoard, row, col, BOT_PLAYER)) {
          return { score: 100000, column: col };
        }

        const result = this.minimax(testBoard, depth - 1, alpha, beta, false);

        if (result.score > maxScore) {
          maxScore = result.score;
          bestColumn = col;
        }

        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break;
      }

      return { score: maxScore, column: bestColumn };
    } else {
      let minScore = Infinity;
      let bestColumn = validMoves[Math.floor(Math.random() * validMoves.length)];

      for (const col of validMoves) {
        const testBoard = GameLogic.cloneBoard(board);
        const row = GameLogic.getNextRow(testBoard, col);
        
        if (row === -1) continue;
        
        testBoard[row][col] = HUMAN_PLAYER;

        // Check for immediate loss using FIXED checkWinner
        if (GameLogic.checkWinner(testBoard, row, col, HUMAN_PLAYER)) {
          return { score: -100000, column: col };
        }

        const result = this.minimax(testBoard, depth - 1, alpha, beta, true);

        if (result.score < minScore) {
          minScore = result.score;
          bestColumn = col;
        }

        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }

      return { score: minScore, column: bestColumn };
    }
  }

  // Evaluate board score
  static evaluateBoard(board) {
    let score = 0;

    // Center column preference
    const centerCol = Math.floor(COLS / 2);
    let centerCount = 0;
    for (let row = 0; row < ROWS; row++) {
      if (board[row][centerCol] === BOT_PLAYER) centerCount++;
    }
    score += centerCount * 3;

    // Evaluate all windows of 4
    score += this.evaluateWindows(board);

    return score;
  }

  // Evaluate all possible windows of 4
  static evaluateWindows(board) {
    let score = 0;

    // Horizontal windows
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        const window = [board[row][col], board[row][col+1], board[row][col+2], board[row][col+3]];
        score += this.evaluateWindow(window);
      }
    }

    // Vertical windows
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row <= ROWS - 4; row++) {
        const window = [board[row][col], board[row+1][col], board[row+2][col], board[row+3][col]];
        score += this.evaluateWindow(window);
      }
    }

    // Diagonal (positive slope)
    for (let row = 0; row <= ROWS - 4; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        const window = [board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3]];
        score += this.evaluateWindow(window);
      }
    }

    // Diagonal (negative slope)
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        const window = [board[row][col], board[row-1][col+1], board[row-2][col+2], board[row-3][col+3]];
        score += this.evaluateWindow(window);
      }
    }

    return score;
  }

  // Evaluate a single window of 4
  static evaluateWindow(window) {
    let score = 0;
    const botCount = window.filter(cell => cell === BOT_PLAYER).length;
    const humanCount = window.filter(cell => cell === HUMAN_PLAYER).length;
    const emptyCount = window.filter(cell => cell === null).length;

    if (botCount === 4) {
      score += 100;
    } else if (botCount === 3 && emptyCount === 1) {
      score += 5;
    } else if (botCount === 2 && emptyCount === 2) {
      score += 2;
    }

    if (humanCount === 3 && emptyCount === 1) {
      score -= 4;
    }

    return score;
  }
}

module.exports = BotService;
