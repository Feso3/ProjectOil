/**
 * Checkerboard Tic-Tac-Toe Game Engine
 *
 * Rules (Coin Toss + Alternating Halves + FIFO):
 * - 8x8 board
 * - Two players: X and O
 * - Win condition: 4-in-a-row entirely in opponent's half
 *
 * COIN TOSS:
 * - At game start, randomly determine which player goes first
 * - Display coin toss result to user
 *
 * ALTERNATING ACTIVE HALF:
 * - Only one half is playable at a time (the "active half")
 * - Active half starts as the starting player's side
 * - After each turn (placement + FIFO resolution), active half toggles
 * - Players can only place pieces in the currently active half
 * - Inactive half is grayed out and non-interactive
 *
 * FIFO CAP:
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

    // Configuration
    this.MAX_ON_BOARD_PER_PLAYER = config.maxOnBoard || 8;

    // RNG for coin toss (injectable for testing)
    // Returns 0 or 1 for determining starting player
    this.rng = config.rng || (() => Math.floor(Math.random() * 2));

    // Row indices that define the boundary
    // Rows 0-3 (indices 0-31) = O's half (top)
    // Rows 4-7 (indices 32-63) = X's half (bottom)
    this.TOP_HALF_MAX_INDEX = 31; // Last index in O's half

    this.reset();
  }

  /**
   * Reset the game to initial state
   * Performs coin toss to determine starting player
   */
  reset() {
    this.board = Array(this.CELLS_COUNT).fill(this.EMPTY);
    this.gameOver = false;
    this.winner = null;
    this.winningLine = null;
    this.moveHistory = [];
    this.plyCount = 0;

    // Coin toss: randomly determine starting player
    const coinToss = this.rng();
    this.startingPlayer = coinToss === 0 ? this.PLAYER_X : this.PLAYER_O;
    this.currentPlayer = this.startingPlayer;

    // Active half: starts as OPPONENT's side (where starting player needs to win)
    // activeHalf ∈ {'X', 'O'} indicates which half is currently playable
    // This ensures starting player can build in enemy territory
    this.activeHalf = this.startingPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    // FIFO tracking
    // pieceData[index] = { player, plyIndex } or null
    this.pieceData = Array(this.CELLS_COUNT).fill(null);

    // FIFO warning highlights gating
    // Per-player flag: only enable warnings after player reaches cap once
    this.fifoWarningsEnabled = {
      X: false,
      O: false
    };

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
   * Get which half is currently active (playable)
   * Returns 'X' or 'O'
   */
  getActiveHalf() {
    return this.activeHalf;
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
   * Predict which piece would be removed if player places at index
   * This is for CPU lookahead - does not modify state
   * Returns index or null
   */
  predictFifoRemoval(player, moveIndex) {
    // Only in open game phase does FIFO trigger
    if (this.phase !== this.PHASE_OPEN_GAME) {
      return null;
    }

    // Count pieces player would have after placing
    const currentCount = this.countPlayerPieces(player);
    const wouldExceed = (currentCount + 1) > this.MAX_ON_BOARD_PER_PLAYER;

    if (!wouldExceed) {
      return null;
    }

    // Return oldest piece
    return this.findOldestPiece(player);
  }

  /**
   * Get the "next out" piece for a player
   * This is the oldest remaining piece that would be removed next time FIFO triggers
   * Returns index or null (null if player has no pieces on board)
   *
   * Used for always-visible "next out" indicators in UI
   */
  getNextOutPiece(player) {
    return this.findOldestPiece(player);
  }

  /**
   * Get FIFO order for a player's pieces
   * Returns array of piece indices sorted from oldest to newest (oldest first)
   * @param {string} player - 'X' or 'O'
   * @param {number} count - Number of pieces to return (optional, default: all)
   * @returns {Array<number>} Array of indices in FIFO order (oldest first)
   *
   * Used for FIFO warning highlights in UI (red = oldest, orange = second-oldest)
   */
  getFifoOrder(player, count = null) {
    const pieces = [];

    // Collect all pieces for this player with their plyIndex
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === player && this.pieceData[i]) {
        pieces.push({
          index: i,
          plyIndex: this.pieceData[i].plyIndex
        });
      }
    }

    // Sort by plyIndex (oldest first)
    pieces.sort((a, b) => a.plyIndex - b.plyIndex);

    // Extract just the indices
    const indices = pieces.map(p => p.index);

    // Return requested count or all
    if (count !== null) {
      return indices.slice(0, count);
    }
    return indices;
  }

  /**
   * Check if FIFO warning highlights should be shown for a player
   * Returns true if player has reached cap at least once this game
   * @param {string} player - 'X' or 'O'
   * @returns {boolean} Whether warnings are enabled for this player
   *
   * Used by UI to gate display of red/orange FIFO warning highlights
   */
  isFifoWarningsEnabled(player) {
    return this.fifoWarningsEnabled[player] === true;
  }

  /**
   * Get preview of all pieces that would be removed if a move is made
   * Simulates the move's removal effects without mutating state
   * Returns { removedPieces: [{ player, index, reason }] }
   *
   * Used for hover-based move preview in UI
   */
  getMoveRemovalPreview(moveIndex) {
    const removedPieces = [];

    // Validate move
    if (!this.isValidMove(moveIndex)) {
      return { removedPieces };
    }

    // Only FIFO removal happens in Open Game phase
    if (this.phase === this.PHASE_OPEN_GAME) {
      const currentPlayer = this.currentPlayer;
      const currentCount = this.countPlayerPieces(currentPlayer);

      // Check if placing would exceed cap
      if ((currentCount + 1) > this.MAX_ON_BOARD_PER_PLAYER) {
        const oldestIndex = this.findOldestPiece(currentPlayer);
        if (oldestIndex !== null) {
          removedPieces.push({
            player: currentPlayer,
            index: oldestIndex,
            reason: 'fifo'
          });
        }
      }
    }

    return { removedPieces };
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

    // Active half restriction: can only place in currently active half
    if (this.activeHalf === 'X' && !this.isInXHalf(index)) {
      return false;
    }
    if (this.activeHalf === 'O' && !this.isInOHalf(index)) {
      return false;
    }

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
      activeHalf: this.activeHalf
    });

    this.plyCount++;

    // 2. FIFO removal (when player exceeds cap)
    let removedIndex = null;
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

    // Update FIFO warning highlights flag (after placement + any removals resolved)
    // Enable warnings for current player if they've reached cap
    const currentPieceCount = this.countPlayerPieces(this.currentPlayer);
    if (currentPieceCount >= this.MAX_ON_BOARD_PER_PLAYER) {
      this.fifoWarningsEnabled[this.currentPlayer] = true;
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
        activeHalf: this.activeHalf,
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
        fifoRemoved: removedIndex !== null ? removedIndex : null,
        activeHalf: this.activeHalf
      };
    }

    // 4. Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    // 5. Toggle active half (alternates every turn)
    this.activeHalf = this.activeHalf === 'X' ? 'O' : 'X';

    return {
      success: true,
      message: "Move applied",
      gameOver: false,
      fifoRemoved: removedIndex !== null ? removedIndex : null,
      activeHalf: this.activeHalf,
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

  /**
   * Clone the engine instance (for CPU search trees)
   * Returns a new GameEngine with the same state
   */
  clone() {
    const cloned = new GameEngine({
      maxOnBoard: this.MAX_ON_BOARD_PER_PLAYER,
      openingPlies: this.OPENING_PLIES
    });
    cloned.loadState(this.getState());
    return cloned;
  }

  /**
   * Get opponent player
   */
  getOpponent(player) {
    return player === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
