import React, { useMemo, useState } from 'react';
import './App.css';

const PLAYER_X = 'X';
const PLAYER_O = 'O';

const WIN_LINES = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Cols
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diags
  [0, 4, 8],
  [2, 4, 6],
];

// PUBLIC_INTERFACE
function App() {
  /** 9-cell board: each cell is null | 'X' | 'O' */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const analysis = useMemo(() => {
    // Determine winner (if any)
    for (const [a, b, c] of WIN_LINES) {
      const v = board[a];
      if (v && v === board[b] && v === board[c]) {
        return {
          winner: v,
          winningLine: [a, b, c],
          isDraw: false,
          isOver: true,
        };
      }
    }

    const isDraw = board.every(Boolean);
    return {
      winner: null,
      winningLine: [],
      isDraw,
      isOver: isDraw,
    };
  }, [board]);

  const currentPlayer = xIsNext ? PLAYER_X : PLAYER_O;

  const statusText = useMemo(() => {
    if (analysis.winner) return `Winner: ${analysis.winner}`;
    if (analysis.isDraw) return 'Draw game!';
    return `Next player: ${currentPlayer}`;
  }, [analysis.winner, analysis.isDraw, currentPlayer]);

  // PUBLIC_INTERFACE
  function handleCellClick(index) {
    // Ignore clicks if the game is over or the cell is already filled.
    if (analysis.isOver || board[index]) return;

    setBoard(prev => {
      const next = prev.slice();
      next[index] = currentPlayer;
      return next;
    });
    setXIsNext(prev => !prev);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }

  return (
    <div className="App">
      <main className="ttt">
        <section className="ttt-card" aria-label="Tic Tac Toe">
          <header className="ttt-header">
            <h1 className="ttt-title">Tic Tac Toe</h1>
            <p className="ttt-subtitle">Local 2-player • Retro mode</p>
          </header>

          <div
            className="ttt-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="ttt-status-label">Status</span>
            <span className="ttt-status-value">{statusText}</span>
          </div>

          <div className="ttt-board" role="grid" aria-label="3 by 3 game board">
            {board.map((cell, idx) => {
              const isWinningCell = analysis.winningLine.includes(idx);
              const isDisabled = Boolean(cell) || analysis.isOver;

              return (
                <button
                  key={idx}
                  type="button"
                  className={[
                    'ttt-cell',
                    isWinningCell ? 'ttt-cell--win' : '',
                    cell === PLAYER_X ? 'ttt-cell--x' : '',
                    cell === PLAYER_O ? 'ttt-cell--o' : '',
                  ].join(' ')}
                  onClick={() => handleCellClick(idx)}
                  disabled={isDisabled}
                  role="gridcell"
                  aria-label={`Cell ${idx + 1}${cell ? `, ${cell}` : ''}`}
                >
                  <span className="ttt-cell-value" aria-hidden="true">
                    {cell ?? ''}
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="ttt-footer">
            <button
              type="button"
              className="ttt-restart"
              onClick={handleRestart}
            >
              Restart
            </button>

            <p className="ttt-hint">
              Tip: First to get 3 in a row wins. Tap “Restart” anytime.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
