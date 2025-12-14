const ROWS = 6;
const COLS = 7;
const EMPTY = null;

class GameLogic {
  // Create empty board
  static createBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
  }

  // Check if column is valid for a move
  static isValidMove(board, col) {
    if (col < 0 || col >= COLS) return false;
    return board[0][col] === EMPTY;
  }

  // Get the row where piece will land
  static getNextRow(board, col) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === EMPTY) {
        return row;
      }
    }
    return -1;
  }

  // Make a move
  static makeMove(board, col, player) {
    const row = this.getNextRow(board, col);
    if (row === -1) return null;
    
    board[row][col] = player;
    return { row, col };
  }

  // COMPLETELY REWRITTEN WIN CHECK - CORRECT VERSION
  static checkWinner(board, lastRow, lastCol, player) {
    // Ensure the last move was actually made by this player
    if (board[lastRow][lastCol] !== player) {
      console.error(`Error: Position [${lastRow}][${lastCol}] is ${board[lastRow][lastCol]}, expected ${player}`);
      return false;
    }

    console.log(`\nChecking win for Player ${player} at position [${lastRow}][${lastCol}]`);

    // Check horizontal (left-right)
    let count = 0;
    // Count to the left
    for (let c = lastCol; c >= 0 && board[lastRow][c] === player; c--) {
      count++;
    }
    // Count to the right (excluding the center piece we already counted)
    for (let c = lastCol + 1; c < COLS && board[lastRow][c] === player; c++) {
      count++;
    }
    console.log(`Horizontal count: ${count}`);
    if (count >= 4) {
      console.log(`WINNER - Horizontal at row ${lastRow}`);
      return true;
    }

    // Check vertical (up-down)
    count = 0;
    // Count upward
    for (let r = lastRow; r >= 0 && board[r][lastCol] === player; r--) {
      count++;
    }
    // Count downward (excluding the center piece)
    for (let r = lastRow + 1; r < ROWS && board[r][lastCol] === player; r++) {
      count++;
    }
    console.log(`Vertical count: ${count}`);
    if (count >= 4) {
      console.log(`WINNER - Vertical at column ${lastCol}`);
      return true;
    }

    // Check diagonal (top-left to bottom-right)
    count = 0;
    // Count toward top-left
    for (let r = lastRow, c = lastCol; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) {
      count++;
    }
    // Count toward bottom-right (excluding center)
    for (let r = lastRow + 1, c = lastCol + 1; r < ROWS && c < COLS && board[r][c] === player; r++, c++) {
      count++;
    }
    console.log(`Diagonal count: ${count}`);
    if (count >= 4) {
      console.log(`WINNER - Diagonal (top-left to bottom-right)`);
      return true;
    }

    // Check anti-diagonal (top-right to bottom-left)
    count = 0;
    // Count toward top-right
    for (let r = lastRow, c = lastCol; r >= 0 && c < COLS && board[r][c] === player; r--, c++) {
      count++;
    }
    // Count toward bottom-left (excluding center)
    for (let r = lastRow + 1, c = lastCol - 1; r < ROWS && c >= 0 && board[r][c] === player; r++, c--) {
      count++;
    }
    console.log(`Anti-diagonal count: ${count}`);
    if (count >= 4) {
      console.log(`WINNER - Anti-diagonal (top-right to bottom-left)`);
      return true;
    }

    console.log(`No win detected for Player ${player}`);
    return false;
  }

  // Check if board is full (draw)
  static isBoardFull(board) {
    return board[0].every(cell => cell !== EMPTY);
  }

  // Get all valid moves
  static getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < COLS; col++) {
      if (this.isValidMove(board, col)) {
        validMoves.push(col);
      }
    }
    return validMoves;
  }

  // Clone board
  static cloneBoard(board) {
    return board.map(row => [...row]);
  }

  // Print board to console for debugging
  static printBoard(board, title = 'Board State') {
    console.log(`\n=== ${title} ===`);
    console.log('  0 1 2 3 4 5 6');
    console.log(' ╔═══════════════╗');
    for (let row = 0; row < ROWS; row++) {
      let rowStr = `${row}║`;
      for (let col = 0; col < COLS; col++) {
        const cell = board[row][col];
        if (cell === null) {
          rowStr += '· ';
        } else if (cell === 1) {
          rowStr += 'O ';
        } else {
          rowStr += 'X ';
        }
      }
      rowStr += '║';
      console.log(rowStr);
    }
    console.log(' ╚═══════════════╝');
  }

  // Validate entire board for any wins (for testing)
  static findAllWins(board) {
    const wins = [];
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const player = board[row][col];
        if (player !== EMPTY) {
          // Check horizontal from this position
          if (col <= COLS - 4) {
            if (board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player) {
              wins.push({
                player,
                type: 'horizontal',
                start: [row, col],
                end: [row, col + 3]
              });
            }
          }
          
          // Check vertical from this position
          if (row <= ROWS - 4) {
            if (board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player) {
              wins.push({
                player,
                type: 'vertical',
                start: [row, col],
                end: [row + 3, col]
              });
            }
          }
          
          // Check diagonal (down-right) from this position
          if (row <= ROWS - 4 && col <= COLS - 4) {
            if (board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player) {
              wins.push({
                player,
                type: 'diagonal-right',
                start: [row, col],
                end: [row + 3, col + 3]
              });
            }
          }
          
          // Check anti-diagonal (down-left) from this position
          if (row <= ROWS - 4 && col >= 3) {
            if (board[row][col] === player &&
                board[row + 1][col - 1] === player &&
                board[row + 2][col - 2] === player &&
                board[row + 3][col - 3] === player) {
              wins.push({
                player,
                type: 'diagonal-left',
                start: [row, col],
                end: [row + 3, col - 3]
              });
            }
          }
        }
      }
    }
    
    return wins;
  }
}

module.exports = GameLogic;
