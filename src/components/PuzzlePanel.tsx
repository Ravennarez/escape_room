"use client";

import { NumericKeypad } from "@/components/NumericKeypad";
import { PaperPuzzle } from "@/components/PaperPuzzle";
import type { GameState, PuzzleId } from "@/game/model";
import { getPuzzleHint, isPuzzleAvailable } from "@/game/rules";
import styles from "./PuzzlePanel.module.css";

interface PuzzlePanelProps {
  puzzle: PuzzleId;
  state: GameState;
  onTap: () => void;
  onSubmit: (answer: string) => void;
  onSpendHint: (puzzle: PuzzleId) => void;
}

const puzzleContent: Record<PuzzleId, { title: string; instruction: string; locked: string }> = {
  "paper-assembly": {
    title: "The paper puzzle",
    instruction: "Arrange the four torn pieces in the order shown on the wall guide.",
    locked: "Examine the paper and the wall guide to uncover the puzzle.",
  },
  "exit-code": {
    title: "Door keypad",
    instruction: "Enter the four-digit code from the note inside the table box.",
    locked: "Find the key, open the table box, and inspect the exit keypad.",
  },
};

function PuzzleControl({
  puzzle,
  onSubmit,
  onTap,
}: Pick<PuzzlePanelProps, "puzzle" | "onSubmit" | "onTap">) {
  switch (puzzle) {
    case "paper-assembly":
      return <PaperPuzzle onSubmit={onSubmit} onTap={onTap} />;
    case "exit-code":
      return <NumericKeypad onSubmit={onSubmit} onTap={onTap} />;
  }
}

export function PuzzlePanel({
  puzzle,
  state,
  onTap,
  onSubmit,
  onSpendHint,
}: PuzzlePanelProps) {
  const content = puzzleContent[puzzle];
  const isSolved = state.solvedPuzzles.includes(puzzle);
  const isAvailable = isPuzzleAvailable(state, puzzle);
  const hasUsedHint = state.hintedPuzzles.includes(puzzle);

  return (
    <section className={styles.puzzle} aria-labelledby={`puzzle-${puzzle}`}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>MECHANISM</p>
        <span className={isSolved ? styles.solvedStatus : styles.puzzleStatus}>
          {isSolved ? "RELEASED" : isAvailable ? "ACTIVE" : "LOCKED"}
        </span>
      </div>
      <h3 id={`puzzle-${puzzle}`}>{content.title}</h3>
      <p className={styles.instruction}>
        {isAvailable ? content.instruction : content.locked}
      </p>
      {isSolved ? (
        <p className={styles.completion}>The mechanism clicks open.</p>
      ) : isAvailable ? (
        <>
          <PuzzleControl puzzle={puzzle} onSubmit={onSubmit} onTap={onTap} />
          {hasUsedHint ? (
            <p className={styles.hintText} role="note">
              <span>FIELD NOTE</span> {getPuzzleHint(puzzle)}
            </p>
          ) : (
            <button
              className={styles.hintButton}
              type="button"
              disabled={state.hintsRemaining === 0}
              onClick={() => {
                onTap();
                onSpendHint(puzzle);
              }}
            >
              {state.hintsRemaining > 0
                ? `Use a hint (${state.hintsRemaining} left)`
                : "No hints remaining"}
            </button>
          )}
        </>
      ) : null}
    </section>
  );
}
