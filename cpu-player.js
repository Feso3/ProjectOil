/**
 * CPU Player for Checkerboard Tic-Tac-Toe
 *
 * Implements deterministic AI with three difficulty levels:
 * - Easy: Heuristic-only (no lookahead)
 * - Medium: Minimax depth 2 with alpha-beta pruning
 * - Hard: Minimax depth 3 with alpha-beta pruning and candidate move pruning
 */

class CPUPlayer {
  constructor(engine, difficulty = 'medium') {
    this.engine = engine;
    this.difficulty = difficulty.toLowerCase();
    this.BOARD_SIZE = 8;
    this.CELLS_COUNT = 64;
    this.WIN_LENGTH = 4;

    // Precompute all 4-length segments for heuristic evaluation
    this.allSegments = this.precomputeSegments();

    // Precompute square influence (how many segments each square participates in)
    this.squareInfluence = this.precomputeSquareInfluence();

    // Configuration
    this.CANDIDATE_COUNT = 12; // Top K moves to consider at each node (Hard mode)
    this.MAX_TIME_MS = 5000; // Time budget safeguard
    this.startTime = 0;
  }

  /**
   * Precompute all possible 4-length segments (H/V/D) on the board
   * Returns array of segment objects with indices and territory info
   */
  precomputeSegments() {
    const segments = [];
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: 1, dc: -1 }  // Diagonal down-left
    ];

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        for (const dir of directions) {
          const segment = [];
          let valid = true;

          for (let i = 0; i < this.WIN_LENGTH; i++) {
            const r = row + i * dir.dr;
            const c = col + i * dir.dc;

            if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) {
              valid = false;
              break;
            }

            segment.push(r * this.BOARD_SIZE + c);
          }

          if (valid) {
            // Determine if segment is entirely in X's half, O's half, or mixed
            const allInXHalf = segment.every(idx => idx > 31);
            const allInOHalf = segment.every(idx => idx <= 31);

            segments.push({
              indices: segment,
              inXHalf: allInXHalf,
              inOHalf: allInOHalf,
              isMixed: !allInXHalf && !allInOHalf
            });
          }
        }
      }
    }

    return segments;
  }

  /**
   * Precompute how many winning segments each square participates in
   * Used for positional bias in heuristic
   */
  precomputeSquareInfluence() {
    const influence = Array(this.CELLS_COUNT).fill(0);

    for (const segment of this.allSegments) {
      for (const idx of segment.indices) {
        influence[idx]++;
      }
    }

    return influence;
  }

  /**
   * Get the best move for current player
   * Returns move index
   */
  getBestMove() {
    this.startTime = Date.now();
    const currentPlayer = this.engine.currentPlayer;

    // Get legal moves
    const legalMoves = this.engine.getValidMoves();

    if (legalMoves.length === 0) {
      return null;
    }

    // First move: deterministic opening strategy
    if (this.engine.plyCount === 0) {
      // X's first move - place in center of X's half
      return 45; // Row 5, col 5 (center-ish of X's half)
    }

    // Check for immediate winning move
    const winningMove = this.findImmediateWin(currentPlayer, legalMoves);
    if (winningMove !== null) {
      return winningMove;
    }

    // Check for immediate blocking move
    const opponent = this.engine.getOpponent(currentPlayer);
    const blockingMove = this.findImmediateWin(opponent, legalMoves);
    if (blockingMove !== null) {
      return blockingMove;
    }

    // Apply difficulty-based strategy
    switch (this.difficulty) {
      case 'easy':
        return this.getBestMoveEasy(legalMoves);
      case 'medium':
        return this.getBestMoveMedium(legalMoves);
      case 'hard':
        return this.getBestMoveHard(legalMoves);
      default:
        return this.getBestMoveMedium(legalMoves);
    }
  }

  /**
   * Easy: Heuristic-only evaluation (no lookahead)
   */
  getBestMoveEasy(legalMoves) {
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      const cloned = this.engine.clone();
      cloned.applyMove(move);

      const score = this.evaluateState(cloned, this.engine.currentPlayer);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Medium: Minimax depth 2 with alpha-beta pruning
   */
  getBestMoveMedium(legalMoves) {
    const currentPlayer = this.engine.currentPlayer;
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of legalMoves) {
      const cloned = this.engine.clone();
      cloned.applyMove(move);

      const score = this.minimax(cloned, 1, false, currentPlayer, alpha, beta);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      alpha = Math.max(alpha, bestScore);
    }

    return bestMove;
  }

  /**
   * Hard: Minimax depth 3 with alpha-beta pruning and candidate move pruning
   */
  getBestMoveHard(legalMoves) {
    const currentPlayer = this.engine.currentPlayer;

    // Build candidate list with pruning
    const candidates = this.getCandidateMoves(this.engine, legalMoves, currentPlayer);

    let bestMove = candidates[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of candidates) {
      const cloned = this.engine.clone();
      cloned.applyMove(move);

      const score = this.minimax(cloned, 2, false, currentPlayer, alpha, beta);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      alpha = Math.max(alpha, bestScore);
    }

    return bestMove;
  }

  /**
   * Find immediate winning move for player
   * Returns move index or null
   */
  findImmediateWin(player, legalMoves) {
    for (const move of legalMoves) {
      const cloned = this.engine.clone();
      const result = cloned.applyMove(move);

      if (result.gameOver && result.winner === player) {
        return move;
      }
    }

    return null;
  }

  /**
   * Get candidate moves for Hard mode (pruned move list)
   * Always includes wins and blocks, then top K heuristic moves
   */
  getCandidateMoves(engine, legalMoves, player) {
    const opponent = engine.getOpponent(player);
    const candidates = new Set();

    // Always include immediate wins
    const winningMove = this.findImmediateWin(player, legalMoves);
    if (winningMove !== null) {
      candidates.add(winningMove);
    }

    // Always include immediate blocks
    const blockingMove = this.findImmediateWin(opponent, legalMoves);
    if (blockingMove !== null) {
      candidates.add(blockingMove);
    }

    // Score remaining moves by heuristic
    const scoredMoves = [];
    for (const move of legalMoves) {
      if (!candidates.has(move)) {
        const cloned = engine.clone();
        cloned.applyMove(move);
        const score = this.evaluateState(cloned, player);
        scoredMoves.push({ move, score });
      }
    }

    // Sort by score (descending) then by index (ascending) for determinism
    scoredMoves.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.move - b.move;
    });

    // Add top K moves
    const remaining = Math.min(this.CANDIDATE_COUNT - candidates.size, scoredMoves.length);
    for (let i = 0; i < remaining; i++) {
      candidates.add(scoredMoves[i].move);
    }

    // Convert to sorted array for determinism
    return Array.from(candidates).sort((a, b) => a - b);
  }

  /**
   * Minimax with alpha-beta pruning
   * @param {GameEngine} engine - Current game state
   * @param {number} depth - Remaining depth
   * @param {boolean} isMaximizing - Is this maximizing player's turn
   * @param {string} perspective - Player we're evaluating for (CPU)
   * @param {number} alpha - Alpha value for pruning
   * @param {number} beta - Beta value for pruning
   */
  minimax(engine, depth, isMaximizing, perspective, alpha, beta) {
    // Time budget check
    if (Date.now() - this.startTime > this.MAX_TIME_MS) {
      return this.evaluateState(engine, perspective);
    }

    // Terminal conditions
    if (engine.gameOver) {
      return this.evaluateTerminal(engine, perspective);
    }

    if (depth === 0) {
      return this.evaluateState(engine, perspective);
    }

    const legalMoves = engine.getValidMoves();
    if (legalMoves.length === 0) {
      return this.evaluateState(engine, perspective);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;

      for (const move of legalMoves) {
        const cloned = engine.clone();
        cloned.applyMove(move);

        const eval_score = this.minimax(cloned, depth - 1, false, perspective, alpha, beta);
        maxEval = Math.max(maxEval, eval_score);
        alpha = Math.max(alpha, eval_score);

        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }

      return maxEval;
    } else {
      let minEval = Infinity;

      for (const move of legalMoves) {
        const cloned = engine.clone();
        cloned.applyMove(move);

        const eval_score = this.minimax(cloned, depth - 1, true, perspective, alpha, beta);
        minEval = Math.min(minEval, eval_score);
        beta = Math.min(beta, eval_score);

        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }

      return minEval;
    }
  }

  /**
   * Evaluate terminal state (win/loss/draw)
   */
  evaluateTerminal(engine, perspective) {
    if (engine.winner === perspective) {
      return 10000; // CPU wins
    } else if (engine.winner === engine.getOpponent(perspective)) {
      return -10000; // CPU loses
    } else {
      return 0; // Draw
    }
  }

  /**
   * Heuristic evaluation of non-terminal state
   * Returns score where higher is better for perspective player
   */
  evaluateState(engine, perspective) {
    const opponent = engine.getOpponent(perspective);

    let score = 0;

    // 1. Threat scoring via segments
    score += this.evaluateSegments(engine, perspective);

    // 2. Positional bias (prefer squares with high influence in opponent's half)
    score += this.evaluatePositionalBias(engine, perspective);

    // 3. FIFO awareness penalty (light)
    // If we're at cap, slightly prefer moves that don't remove critical pieces
    // This is a simplified version - full FIFO awareness would be more complex

    return score;
  }

  /**
   * Evaluate all segments for threat scoring
   */
  evaluateSegments(engine, perspective) {
    const opponent = engine.getOpponent(perspective);
    let score = 0;

    for (const segment of this.allSegments) {
      // Only evaluate segments in opponent's half (where perspective can win)
      const isRelevantForPerspective =
        (perspective === 'X' && segment.inOHalf) ||
        (perspective === 'O' && segment.inXHalf);

      const isRelevantForOpponent =
        (opponent === 'X' && segment.inOHalf) ||
        (opponent === 'O' && segment.inXHalf);

      // Count pieces in this segment
      let perspectiveCount = 0;
      let opponentCount = 0;
      let emptyCount = 0;

      for (const idx of segment.indices) {
        if (engine.board[idx] === perspective) {
          perspectiveCount++;
        } else if (engine.board[idx] === opponent) {
          opponentCount++;
        } else {
          emptyCount++;
        }
      }

      // Score perspective's threats in opponent's half
      if (isRelevantForPerspective && opponentCount === 0) {
        if (perspectiveCount === 4) {
          score += 1000; // Winning position (shouldn't happen in non-terminal)
        } else if (perspectiveCount === 3 && emptyCount === 1) {
          score += 100; // Strong threat
        } else if (perspectiveCount === 2 && emptyCount === 2) {
          score += 10; // Medium threat
        } else if (perspectiveCount === 1 && emptyCount === 3) {
          score += 1; // Weak threat
        }
      }

      // Penalize opponent's threats in perspective's half
      if (isRelevantForOpponent && perspectiveCount === 0) {
        if (opponentCount === 4) {
          score -= 1000; // Losing position
        } else if (opponentCount === 3 && emptyCount === 1) {
          score -= 100; // Must block
        } else if (opponentCount === 2 && emptyCount === 2) {
          score -= 10; // Moderate threat
        } else if (opponentCount === 1 && emptyCount === 3) {
          score -= 1; // Weak threat
        }
      }
    }

    return score;
  }

  /**
   * Evaluate positional bias based on square influence
   */
  evaluatePositionalBias(engine, perspective) {
    let score = 0;
    const TOP_HALF_MAX = 31;

    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (engine.board[i] === perspective) {
        // Bonus for pieces in opponent's half with high influence
        const inOpponentHalf =
          (perspective === 'X' && i <= TOP_HALF_MAX) ||
          (perspective === 'O' && i > TOP_HALF_MAX);

        if (inOpponentHalf) {
          score += this.squareInfluence[i] * 0.5;
        }
      }
    }

    return score;
  }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CPUPlayer;
}
