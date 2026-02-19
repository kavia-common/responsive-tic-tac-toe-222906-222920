import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getBoardCells() {
  // The board is a grid and each cell is a gridcell role button.
  return screen.getAllByRole('gridcell');
}

function expectStatus(textOrRegex) {
  // Status is rendered inside a role="status" container.
  expect(screen.getByRole('status')).toHaveTextContent(textOrRegex);
}

async function clickCell(user, index) {
  const cells = getBoardCells();
  await user.click(cells[index]);
}

describe('Tic Tac Toe core gameplay', () => {
  test('renders the title, board, and restart button', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /tic tac toe/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('grid', { name: /3 by 3 game board/i })
    ).toBeInTheDocument();

    // 9 playable cells
    expect(getBoardCells()).toHaveLength(9);

    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();

    // Initial player indicator
    expectStatus(/next player:\s*x/i);
  });

  test('alternates turns: X then O, updating the status each move', async () => {
    const user = userEvent.setup();
    render(<App />);

    // X plays cell 1
    await clickCell(user, 0);
    expectStatus(/next player:\s*o/i);
    expect(getBoardCells()[0]).toHaveAccessibleName(/cell 1,\s*x/i);

    // O plays cell 2
    await clickCell(user, 1);
    expectStatus(/next player:\s*x/i);
    expect(getBoardCells()[1]).toHaveAccessibleName(/cell 2,\s*o/i);
  });

  test('prevents overwriting an occupied cell and does not advance the turn', async () => {
    const user = userEvent.setup();
    render(<App />);

    // X plays cell 1
    await clickCell(user, 0);
    expect(getBoardCells()[0]).toHaveAccessibleName(/cell 1,\s*x/i);
    expectStatus(/next player:\s*o/i);

    // Clicking the same cell again should be impossible (disabled),
    // and should not change status/turn.
    expect(getBoardCells()[0]).toBeDisabled();
    await user.click(getBoardCells()[0]);

    // Still O's turn; still X in the cell.
    expectStatus(/next player:\s*o/i);
    expect(getBoardCells()[0]).toHaveAccessibleName(/cell 1,\s*x/i);
  });

  test('detects a win (row) and ends the game (all cells disabled)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // X wins top row: 0,1,2
    // Move order:
    // X:0 O:3 X:1 O:4 X:2
    await clickCell(user, 0); // X
    await clickCell(user, 3); // O
    await clickCell(user, 1); // X
    await clickCell(user, 4); // O
    await clickCell(user, 2); // X -> win

    expectStatus(/winner:\s*x/i);

    // After win, all cells should be disabled (game over)
    for (const cell of getBoardCells()) {
      expect(cell).toBeDisabled();
    }

    // Winner cells should get the win class
    const cells = getBoardCells();
    expect(cells[0]).toHaveClass('ttt-cell--win');
    expect(cells[1]).toHaveClass('ttt-cell--win');
    expect(cells[2]).toHaveClass('ttt-cell--win');
  });

  test('detects a draw when the board is full with no winner, and ends the game', async () => {
    const user = userEvent.setup();
    render(<App />);

    // A known draw sequence (no 3-in-a-row):
    // X:0 O:1 X:2 O:4 X:3 O:5 X:7 O:6 X:8
    await clickCell(user, 0); // X
    await clickCell(user, 1); // O
    await clickCell(user, 2); // X
    await clickCell(user, 4); // O
    await clickCell(user, 3); // X
    await clickCell(user, 5); // O
    await clickCell(user, 7); // X
    await clickCell(user, 6); // O
    await clickCell(user, 8); // X (board full)

    expectStatus(/draw game!/i);

    // After draw, all cells should be disabled (game over)
    for (const cell of getBoardCells()) {
      expect(cell).toBeDisabled();
    }

    // No winning highlight in a draw
    for (const cell of getBoardCells()) {
      expect(cell).not.toHaveClass('ttt-cell--win');
    }
  });

  test('restart clears the board and resets turn/status back to X', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Make a couple of moves first
    await clickCell(user, 0); // X
    await clickCell(user, 1); // O
    expectStatus(/next player:\s*x/i);

    // Restart
    await user.click(screen.getByRole('button', { name: /restart/i }));

    // Status reset
    expectStatus(/next player:\s*x/i);

    // All cells empty and enabled
    const cells = getBoardCells();
    for (let i = 0; i < cells.length; i += 1) {
      // Accessible name should revert to "Cell N" without ", X/O"
      expect(cells[i]).toHaveAccessibleName(new RegExp(`cell ${i + 1}$`, 'i'));
      expect(cells[i]).not.toBeDisabled();
    }
  });

  test('restart works after a completed game (win), allowing a new game to start', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Quick win for X: 0,1,2 with O elsewhere
    await clickCell(user, 0); // X
    await clickCell(user, 3); // O
    await clickCell(user, 1); // X
    await clickCell(user, 4); // O
    await clickCell(user, 2); // X -> win

    expectStatus(/winner:\s*x/i);

    // Restart should clear win highlight and allow interaction
    await user.click(screen.getByRole('button', { name: /restart/i }));
    expectStatus(/next player:\s*x/i);

    const cells = getBoardCells();
    for (const cell of cells) {
      expect(cell).not.toBeDisabled();
      expect(cell).not.toHaveClass('ttt-cell--win');
    }

    // Verify a new move is possible
    await clickCell(user, 8);
    expect(cells[8]).toHaveAccessibleName(/cell 9,\s*x/i);
    expectStatus(/next player:\s*o/i);
  });

  test('the board is operable via its gridcell buttons and reflects moves via accessible names', async () => {
    const user = userEvent.setup();
    render(<App />);

    // This is a small accessibility-oriented check:
    // The aria-label includes "Cell N, X/O" after moves.
    const board = screen.getByRole('grid', { name: /3 by 3 game board/i });
    const cells = within(board).getAllByRole('gridcell');

    await user.click(cells[4]); // center
    expect(cells[4]).toHaveAccessibleName(/cell 5,\s*x/i);
  });
});
