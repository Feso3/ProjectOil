/**
 * Checkerboard Tic-Tac-Toe Game Engine
 *
 * Rules:
 * - 8x8 board
 * - Two players: X and O
 * - Win condition: 4-in-a-row (horizontal, vertical, or diagonal)
 * - Critical constraint: The 4-in-a-row must be entirely in the opponent's side
 *
 * Sides definition:
 * - X's home side: rows 5-8 (bottom half, indices 32-63)
 * - X's opponent side: rows 1-4 (top half, indices 0-31)
 * - O's home side: rows 1-4 (top half, indices 0-31)
 * - O's opponent side: rows 5-8 (bottom half, indices 32-63)
 */

class GameEngine {
  constructor() {
    this.BOARD_SIZE = 8;
    this.CELLS_COUNT = this.BOARD_SIZE * this.BOARD_SIZE; // 64
    this.WIN_LENGTH = 4;
    this.EMPTY = "";
    this.PLAYER_X = "X";
    this.PLAYER_O = "O";

    // Row indices that define the boundary
    // Rows 0-3 (indices 0-31) = top half (O's home, X's opponent side)
    // Rows 4-7 (indices 32-63) = bottom half (X's home, O's opponent side)
    this.TOP_HALF_MAX_INDEX = 31; // Last index in top half

    this.reset();
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.board = Array(this.CELLS_COUNT).fill(this.EMPTY);
    this.currentPlayer = this.PLAYER_X;
    this.gameOver = false;
    this.winner = null;
    this.winningLine = null;
    this.moveHistory = [];
  }

  /**
   * Convert index to row, col coordinates
   */
  indexToCoords(index) {
    return {
      row: Math.floor(index / this.BOARD_SIZE),
      col: index % this.BOARD_SIZE
    };
  }

  /**
   * Convert row, col to index
   */
  coordsToIndex(row, col) {
    return row * this.BOARD_SIZE + col;
  }

  /**
   * Check if a position is valid and empty
   */
  isValidMove(index) {
    return index >= 0 &&
           index < this.CELLS_COUNT &&
           this.board[index] === this.EMPTY &&
           !this.gameOver;
  }

  /**
   * Get all valid (empty) positions
   */
  getValidMoves() {
    return this.board
      .map((cell, index) => cell === this.EMPTY ? index : null)
      .filter(index => index !== null);
  }

  /**
   * Apply a move to the board
   * Returns { success: boolean, message: string }
   */
  applyMove(index) {
    if (this.gameOver) {
      return { success: false, message: "Game is already over" };
    }

    if (!this.isValidMove(index)) {
      return { success: false, message: "Invalid move" };
    }

    // Place the piece
    this.board[index] = this.currentPlayer;

    // Record move history
    const coords = this.indexToCoords(index);
    this.moveHistory.push({
      player: this.currentPlayer,
      index,
      row: coords.row,
      col: coords.col
    });

    // Check for win
    const winResult = this.checkWin(this.currentPlayer);
    if (winResult.isWin) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.winningLine = winResult.line;
      return {
        success: true,
        message: `${this.currentPlayer} wins!`,
        gameOver: true,
        winner: this.currentPlayer,
        winningLine: winResult.line
      };
    }

    // Check for draw
    if (this.getValidMoves().length === 0) {
      this.gameOver = true;
      return {
        success: true,
        message: "Draw!",
        gameOver: true,
        winner: null
      };
    }

    // Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Move applied",
      gameOver: false
    };
  }

  /**
   * Check if all indices in a line are in the opponent's side for the given player
   */
  isLineInOpponentSide(line, player) {
    if (player === this.PLAYER_X) {
      // X's opponent side is top half (indices 0-31)
      return line.every(index => index <= this.TOP_HALF_MAX_INDEX);
    } else {
      // O's opponent side is bottom half (indices 32-63)
      return line.every(index => index > this.TOP_HALF_MAX_INDEX);
    }
  }

  /**
   * Check for a win for the given player
   * Returns { isWin: boolean, line: array of indices or null }
   */
  checkWin(player) {
    // Check all possible 4-in-a-row lines
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: 1, dc: -1 }  // Diagonal down-left
    ];

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        for (const dir of directions) {
          const line = this.checkLineFromPosition(row, col, dir.dr, dir.dc, player);
          if (line && line.length === this.WIN_LENGTH) {
            // Check if the line is entirely in the opponent's side
            if (this.isLineInOpponentSide(line, player)) {
              return { isWin: true, line };
            }
          }
        }
      }
    }

    return { isWin: false, line: null };
  }

  /**
   * Check for a line of WIN_LENGTH from a given position in a given direction
   * Returns array of indices if found, null otherwise
   */
  checkLineFromPosition(startRow, startCol, dr, dc, player) {
    const line = [];

    for (let i = 0; i < this.WIN_LENGTH; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;

      // Check bounds
      if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
        return null;
      }

      const index = this.coordsToIndex(row, col);

      // Check if this cell has the player's piece
      if (this.board[index] !== player) {
        return null;
      }

      line.push(index);
    }

    return line;
  }

  /**
   * Get the current game state (for serialization/debugging)
   */
  getState() {
    return {
      board: [...this.board],
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      winningLine: this.winningLine ? [...this.winningLine] : null,
      moveHistory: [...this.moveHistory]
    };
  }

  /**
   * Load a game state (for testing or undo functionality)
   */
  loadState(state) {
    this.board = [...state.board];
    this.currentPlayer = state.currentPlayer;
    this.gameOver = state.gameOver;
    this.winner = state.winner;
    this.winningLine = state.winningLine ? [...state.winningLine] : null;
    this.moveHistory = [...state.moveHistory];
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
