/**
 * Checkerboard Tic-Tac-Toe Game Engine
 *
 * Rules:
 * - 8x8 board
 * - Two players: X and O
 * - Win condition: 4-in-a-row (horizontal, vertical, or diagonal)
 * - Critical constraint: The 4-in-a-row must be entirely in the opponent's side
 * - Invasion Cap: Maximum N pieces per player on opponent's half at once (default: 8)
 *
 * Sides definition:
 * - X's home side: rows 5-8 (bottom half, indices 32-63)
 * - X's opponent side: rows 1-4 (top half, indices 0-31)
 * - O's home side: rows 1-4 (top half, indices 0-31)
 * - O's opponent side: rows 5-8 (bottom half, indices 32-63)
 */

class GameEngine {
  constructor(config = {}) {
    this.BOARD_SIZE = 8;
    this.CELLS_COUNT = this.BOARD_SIZE * this.BOARD_SIZE; // 64
    this.WIN_LENGTH = 4;
    this.EMPTY = "";
    this.PLAYER_X = "X";
    this.PLAYER_O = "O";

    // Invasion cap: max pieces on opponent half
    this.INVASION_CAP = config.invasionCap || 8;

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
    this.pendingRemoval = false; // Awaiting removal due to invasion cap
    this.lastPlacedIndex = null; // Track last placed piece for invasion cap logic
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
   * Check if index is in the opponent's half for the given player
   */
  isInOpponentHalf(index, player) {
    if (player === this.PLAYER_X) {
      // X's opponent half is top half (indices 0-31)
      return index <= this.TOP_HALF_MAX_INDEX;
    } else {
      // O's opponent half is bottom half (indices 32-63)
      return index > this.TOP_HALF_MAX_INDEX;
    }
  }

  /**
   * Count how many of player's pieces are on opponent's half
   */
  countPiecesOnOpponentHalf(player) {
    let count = 0;
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.isInOpponentHalf(i, player)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get indices of player's pieces on opponent's half (for removal selection)
   */
  getPiecesOnOpponentHalf(player) {
    const pieces = [];
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.isInOpponentHalf(i, player)) {
        pieces.push(i);
      }
    }
    return pieces;
  }

  /**
   * Check if a position is valid and empty
   */
  isValidMove(index) {
    return index >= 0 &&
           index < this.CELLS_COUNT &&
           this.board[index] === this.EMPTY &&
           !this.gameOver &&
           !this.pendingRemoval; // Can't place if removal pending
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
   *
   * Turn order with invasion cap:
   * 1. Place piece
   * 2. Check if invasion cap exceeded
   * 3. If exceeded, require removal (pendingRemoval = true)
   * 4. If not exceeded, check win and switch player
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
    this.lastPlacedIndex = index;

    // Record move history
    const coords = this.indexToCoords(index);
    this.moveHistory.push({
      player: this.currentPlayer,
      index,
      row: coords.row,
      col: coords.col
    });

    // Check invasion cap BEFORE win check
    const piecesOnOpponentHalf = this.countPiecesOnOpponentHalf(this.currentPlayer);
    if (piecesOnOpponentHalf > this.INVASION_CAP) {
      // Cap exceeded - require removal
      this.pendingRemoval = true;
      const removablePieces = this.getPiecesOnOpponentHalf(this.currentPlayer);
      return {
        success: true,
        message: `Invasion cap exceeded (${piecesOnOpponentHalf}/${this.INVASION_CAP}). Select a piece to remove.`,
        invasionCapExceeded: true,
        removablePieces,
        currentCount: piecesOnOpponentHalf,
        cap: this.INVASION_CAP
      };
    }

    // No cap issue - proceed with normal win check and turn switch
    return this.completeTurn();
  }

  /**
   * Remove a piece from the board (invasion cap enforcement)
   * Returns { success: boolean, message: string }
   */
  removePiece(index) {
    if (!this.pendingRemoval) {
      return { success: false, message: "No removal required" };
    }

    // Validate: must be current player's piece on opponent half
    if (this.board[index] !== this.currentPlayer) {
      return { success: false, message: "Not your piece" };
    }

    if (!this.isInOpponentHalf(index, this.currentPlayer)) {
      return { success: false, message: "Piece not on opponent half" };
    }

    // Don't allow removing the just-placed piece
    if (index === this.lastPlacedIndex) {
      return { success: false, message: "Cannot remove the piece you just placed" };
    }

    // Remove the piece
    this.board[index] = this.EMPTY;
    this.pendingRemoval = false;

    // Record removal in history
    const coords = this.indexToCoords(index);
    this.moveHistory.push({
      type: 'removal',
      player: this.currentPlayer,
      index,
      row: coords.row,
      col: coords.col
    });

    // Now complete the turn (check win, switch player)
    return this.completeTurn();
  }

  /**
   * Complete the turn after placement (and optional removal)
   * Check for win, draw, and switch player
   */
  completeTurn() {
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
      moveHistory: [...this.moveHistory],
      pendingRemoval: this.pendingRemoval,
      lastPlacedIndex: this.lastPlacedIndex,
      invasionCap: this.INVASION_CAP
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
    this.pendingRemoval = state.pendingRemoval || false;
    this.lastPlacedIndex = state.lastPlacedIndex || null;
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
