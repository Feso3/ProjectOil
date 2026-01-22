/**
 * Checkerboard Tic-Tac-Toe Game Engine
 *
 * Rules (vNext):
 * - 8x8 board
 * - Two players: X and O
 * - Win condition: 4-in-a-row (horizontal, vertical, or diagonal) entirely in opponent's half
 * - TOTAL_CAP: Maximum 15 pieces per player on board (default: 15)
 * - INVASION_CAP: Maximum 8 pieces per player on opponent's half (default: 8)
 * - FIFO Removal: When caps exceeded, automatically remove OLDEST piece from HOME half
 * - Resolution order: Place → Invasion Penalty → Total Cap → Win Check
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

    // Caps
    this.TOTAL_CAP = config.totalCap || 15;
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

    // Track placement order for FIFO removal
    // pieceData[index] = { player, turnIndex } or null
    this.pieceData = Array(this.CELLS_COUNT).fill(null);
    this.turnCounter = 0; // Monotonic counter for placement order

    // Track automatic removals for this turn
    this.autoRemovals = [];
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
   * Check if index is in the home half for the given player
   */
  isInHomeHalf(index, player) {
    if (player === this.PLAYER_X) {
      // X's home half is bottom half (indices 32-63)
      return index > this.TOP_HALF_MAX_INDEX;
    } else {
      // O's home half is top half (indices 0-31)
      return index <= this.TOP_HALF_MAX_INDEX;
    }
  }

  /**
   * Count total pieces for player on entire board
   */
  countTotalPieces(player) {
    let count = 0;
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player) {
        count++;
      }
    }
    return count;
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
   * Count how many of player's pieces are on home half
   */
  countPiecesOnHomeHalf(player) {
    let count = 0;
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.isInHomeHalf(i, player)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Find the oldest piece for a player in a specific region
   * Returns index or null
   */
  findOldestPiece(player, preferHome = true) {
    let oldestIndex = null;
    let oldestTurn = Infinity;

    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.pieceData[i]) {
        const isHome = this.isInHomeHalf(i, player);

        if (preferHome && !isHome) {
          // Skip non-home pieces if we prefer home
          continue;
        }

        if (this.pieceData[i].turnIndex < oldestTurn) {
          oldestTurn = this.pieceData[i].turnIndex;
          oldestIndex = i;
        }
      }
    }

    // Fallback: if preferHome but no home pieces found, find oldest anywhere
    if (preferHome && oldestIndex === null) {
      return this.findOldestPiece(player, false);
    }

    return oldestIndex;
  }

  /**
   * Remove a piece from the board (automatic FIFO removal)
   * Returns index of removed piece or null
   */
  removeOldestFromHome(player, reason) {
    const oldestIndex = this.findOldestPiece(player, true);

    if (oldestIndex === null) {
      return null;
    }

    const coords = this.indexToCoords(oldestIndex);

    // Remove the piece
    this.board[oldestIndex] = this.EMPTY;
    this.pieceData[oldestIndex] = null;

    // Record removal in history
    this.moveHistory.push({
      type: 'removal',
      player: player,
      index: oldestIndex,
      row: coords.row,
      col: coords.col,
      reason: reason
    });

    // Track for this turn's UI notification
    this.autoRemovals.push({
      index: oldestIndex,
      coords: coords,
      reason: reason
    });

    return oldestIndex;
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
   * Returns { success: boolean, message: string, ... }
   *
   * Resolution order:
   * 1. Place piece
   * 2. Apply invasion penalty if opponent-half count exceeded
   * 3. Apply total cap if total count exceeded
   * 4. Check win condition
   * 5. Switch player
   */
  applyMove(index) {
    if (this.gameOver) {
      return { success: false, message: "Game is already over" };
    }

    if (!this.isValidMove(index)) {
      return { success: false, message: "Invalid move" };
    }

    // Clear auto-removals from previous turn
    this.autoRemovals = [];

    // 1. Place the piece
    this.board[index] = this.currentPlayer;
    this.pieceData[index] = {
      player: this.currentPlayer,
      turnIndex: this.turnCounter++
    };

    // Record move history
    const coords = this.indexToCoords(index);
    this.moveHistory.push({
      type: 'placement',
      player: this.currentPlayer,
      index,
      row: coords.row,
      col: coords.col
    });

    // 2. Check invasion cap and apply penalty
    const onOpponentHalf = this.isInOpponentHalf(index, this.currentPlayer);
    if (onOpponentHalf) {
      const invasionCount = this.countPiecesOnOpponentHalf(this.currentPlayer);
      if (invasionCount > this.INVASION_CAP) {
        // Invasion penalty: remove oldest home piece
        this.removeOldestFromHome(this.currentPlayer, 'invasion_penalty');
      }
    }

    // 3. Check total cap
    const totalCount = this.countTotalPieces(this.currentPlayer);
    if (totalCount > this.TOTAL_CAP) {
      // Total cap: remove oldest home piece
      this.removeOldestFromHome(this.currentPlayer, 'total_cap');
    }

    // 4. Check for win
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
        winningLine: winResult.line,
        autoRemovals: this.autoRemovals,
        totalPieces: this.countTotalPieces(this.currentPlayer),
        invasionPieces: this.countPiecesOnOpponentHalf(this.currentPlayer)
      };
    }

    // Check for draw
    if (this.getValidMoves().length === 0) {
      this.gameOver = true;
      return {
        success: true,
        message: "Draw!",
        gameOver: true,
        winner: null,
        autoRemovals: this.autoRemovals
      };
    }

    // 5. Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Move applied",
      gameOver: false,
      autoRemovals: this.autoRemovals,
      totalPieces: this.countTotalPieces(this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X),
      invasionPieces: this.countPiecesOnOpponentHalf(this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X)
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
      pieceData: [...this.pieceData],
      turnCounter: this.turnCounter,
      totalCap: this.TOTAL_CAP,
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
    this.pieceData = [...state.pieceData];
    this.turnCounter = state.turnCounter || 0;
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
