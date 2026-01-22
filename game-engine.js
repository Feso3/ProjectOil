/**
 * Checkerboard Tic-Tac-Toe Game Engine
 *
 * Rules (Staged Opening + FIFO):
 * - 8x8 board
 * - Two players: X and O
 * - Win condition: 4-in-a-row entirely in opponent's half
 *
 * STAGED OPENING PHASE (6 plies):
 * - Round 1 (plies 1-2): Both players place on X's half
 * - Round 2 (plies 3-4): Both players place on O's half
 * - Round 3 (plies 5-6): Both players place on X's half
 * - After opening: 3 pieces per player on board
 *
 * OPEN GAME PHASE (after ply 6):
 * - Place anywhere on empty squares
 * - MAX_ON_BOARD_PER_PLAYER = 8 (default, configurable)
 * - FIFO removal: When placing 9th piece, automatically remove oldest piece
 *
 * Sides definition:
 * - X's half: rows 5-8 (bottom half, indices 32-63)
 * - O's half: rows 1-4 (top half, indices 0-31)
 */

class GameEngine {
  constructor(config = {}) {
    this.BOARD_SIZE = 8;
    this.CELLS_COUNT = this.BOARD_SIZE * this.BOARD_SIZE; // 64
    this.WIN_LENGTH = 4;
    this.EMPTY = "";
    this.PLAYER_X = "X";
    this.PLAYER_O = "O";

    // Game phases
    this.PHASE_OPENING = "OPENING";
    this.PHASE_OPEN_GAME = "OPEN_GAME";

    // Configuration
    this.MAX_ON_BOARD_PER_PLAYER = config.maxOnBoard || 8;
    this.OPENING_PLIES = config.openingPlies || 6;

    // Row indices that define the boundary
    // Rows 0-3 (indices 0-31) = O's half (top)
    // Rows 4-7 (indices 32-63) = X's half (bottom)
    this.TOP_HALF_MAX_INDEX = 31; // Last index in O's half

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

    // Phase tracking
    this.phase = this.PHASE_OPENING;
    this.plyCount = 0; // 0-based: 0-5 = opening, 6+ = open game

    // FIFO tracking
    // pieceData[index] = { player, plyIndex } or null
    this.pieceData = Array(this.CELLS_COUNT).fill(null);

    // For UI preview of FIFO removal
    this.fifoRemovalPreview = null;
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
   * Check if index is in X's half (bottom half)
   */
  isInXHalf(index) {
    return index > this.TOP_HALF_MAX_INDEX;
  }

  /**
   * Check if index is in O's half (top half)
   */
  isInOHalf(index) {
    return index <= this.TOP_HALF_MAX_INDEX;
  }

  /**
   * Check if index is in opponent's half for given player
   */
  isInOpponentHalf(index, player) {
    if (player === this.PLAYER_X) {
      // X's opponent half is O's half (top)
      return this.isInOHalf(index);
    } else {
      // O's opponent half is X's half (bottom)
      return this.isInXHalf(index);
    }
  }

  /**
   * Get required half for current ply during opening
   * Returns 'X' or 'O' for which half is required
   */
  getRequiredHalfForOpening() {
    if (this.phase !== this.PHASE_OPENING) {
      return null;
    }

    // Opening pattern:
    // Ply 0-1 (Round 1): X's half
    // Ply 2-3 (Round 2): O's half
    // Ply 4-5 (Round 3): X's half
    if (this.plyCount <= 1) {
      return 'X';
    } else if (this.plyCount <= 3) {
      return 'O';
    } else if (this.plyCount <= 5) {
      return 'X';
    }
    return null;
  }

  /**
   * Count total pieces for player on board
   */
  countPlayerPieces(player) {
    let count = 0;
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get all pieces for a player (returns array of indices)
   */
  getPlayerPieces(player) {
    const pieces = [];
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player) {
        pieces.push(i);
      }
    }
    return pieces;
  }

  /**
   * Find oldest piece for player (FIFO - lowest plyIndex)
   * Returns index or null
   */
  findOldestPiece(player) {
    let oldestIndex = null;
    let oldestPly = Infinity;

    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.pieceData[i]) {
        if (this.pieceData[i].plyIndex < oldestPly) {
          oldestPly = this.pieceData[i].plyIndex;
          oldestIndex = i;
        }
      }
    }

    return oldestIndex;
  }

  /**
   * Get piece that would be removed if player places now (for preview)
   * Returns index or null
   */
  getPieceToRemovePreview(player) {
    const currentCount = this.countPlayerPieces(player);
    if (currentCount < this.MAX_ON_BOARD_PER_PLAYER) {
      return null;
    }
    return this.findOldestPiece(player);
  }

  /**
   * Check if a position is valid for current phase
   */
  isValidMove(index) {
    if (index < 0 || index >= this.CELLS_COUNT) {
      return false;
    }

    if (this.board[index] !== this.EMPTY) {
      return false;
    }

    if (this.gameOver) {
      return false;
    }

    // Opening phase restrictions
    if (this.phase === this.PHASE_OPENING) {
      const requiredHalf = this.getRequiredHalfForOpening();
      if (requiredHalf === 'X' && !this.isInXHalf(index)) {
        return false;
      }
      if (requiredHalf === 'O' && !this.isInOHalf(index)) {
        return false;
      }
    }

    // Open game: anywhere is fine
    return true;
  }

  /**
   * Get all valid (empty) positions for current phase
   */
  getValidMoves() {
    const moves = [];
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.isValidMove(i)) {
        moves.push(i);
      }
    }
    return moves;
  }

  /**
   * Apply a move to the board
   * Returns { success: boolean, message: string, ... }
   *
   * Resolution order:
   * 1. Place piece
   * 2. If player exceeds MAX_ON_BOARD, remove oldest piece (FIFO)
   * 3. Check win condition
   * 4. Switch player
   */
  applyMove(index) {
    if (this.gameOver) {
      return { success: false, message: "Game is already over" };
    }

    if (!this.isValidMove(index)) {
      return { success: false, message: "Invalid move for current phase" };
    }

    // 1. Place the piece
    this.board[index] = this.currentPlayer;
    this.pieceData[index] = {
      player: this.currentPlayer,
      plyIndex: this.plyCount
    };

    // Record placement in history
    const coords = this.indexToCoords(index);
    this.moveHistory.push({
      type: 'placement',
      player: this.currentPlayer,
      index,
      row: coords.row,
      col: coords.col,
      ply: this.plyCount,
      phase: this.phase
    });

    this.plyCount++;

    // Update phase if opening just completed
    if (this.phase === this.PHASE_OPENING && this.plyCount >= this.OPENING_PLIES) {
      this.phase = this.PHASE_OPEN_GAME;
    }

    // 2. FIFO removal (Open Game phase only)
    let removedIndex = null;
    if (this.phase === this.PHASE_OPEN_GAME) {
      const pieceCount = this.countPlayerPieces(this.currentPlayer);
      if (pieceCount > this.MAX_ON_BOARD_PER_PLAYER) {
        removedIndex = this.findOldestPiece(this.currentPlayer);
        if (removedIndex !== null) {
          const removedCoords = this.indexToCoords(removedIndex);

          // Remove the piece
          this.board[removedIndex] = this.EMPTY;
          this.pieceData[removedIndex] = null;

          // Record removal in history
          this.moveHistory.push({
            type: 'fifo_removal',
            player: this.currentPlayer,
            index: removedIndex,
            row: removedCoords.row,
            col: removedCoords.col,
            ply: this.plyCount - 1
          });
        }
      }
    }

    // 3. Check for win
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
        fifoRemoved: removedIndex !== null ? removedIndex : null,
        phase: this.phase,
        plyCount: this.plyCount
      };
    }

    // Check for draw (board full)
    if (this.getValidMoves().length === 0) {
      this.gameOver = true;
      return {
        success: true,
        message: "Draw!",
        gameOver: true,
        winner: null,
        fifoRemoved: removedIndex !== null ? removedIndex : null
      };
    }

    // 4. Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Move applied",
      gameOver: false,
      fifoRemoved: removedIndex !== null ? removedIndex : null,
      phase: this.phase,
      plyCount: this.plyCount
    };
  }

  /**
   * Check if all indices in a line are in the opponent's side for the given player
   */
  isLineInOpponentSide(line, player) {
    if (player === this.PLAYER_X) {
      // X's opponent side is O's half (top)
      return line.every(index => this.isInOHalf(index));
    } else {
      // O's opponent side is X's half (bottom)
      return line.every(index => this.isInXHalf(index));
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
      phase: this.phase,
      plyCount: this.plyCount,
      pieceData: [...this.pieceData],
      maxOnBoard: this.MAX_ON_BOARD_PER_PLAYER,
      openingPlies: this.OPENING_PLIES
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
    this.phase = state.phase || this.PHASE_OPENING;
    this.plyCount = state.plyCount || 0;
    this.pieceData = [...state.pieceData];
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
