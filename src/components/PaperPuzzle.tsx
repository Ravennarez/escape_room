"use client";

import { useState } from "react";
import styles from "./PaperPuzzle.module.css";

const symbolNames = {
  triangle: "triangle",
  circle: "circle",
  square: "square",
  diamond: "diamond",
} as const;

const symbolMarks = {
  triangle: "△",
  circle: "○",
  square: "□",
  diamond: "◇",
} as const;

type PaperSymbol = keyof typeof symbolNames;

interface PaperPuzzleProps {
  onTap: () => void;
  onSubmit: (answer: string) => void;
}

export function PaperPuzzle({ onSubmit, onTap }: PaperPuzzleProps) {
  const [pieces, setPieces] = useState<PaperSymbol[]>([
    "diamond",
    "circle",
    "triangle",
    "square",
  ]);
  const [selectedPiece, setSelectedPiece] = useState<PaperSymbol | null>(null);

  function choosePiece(piece: PaperSymbol) {
    onTap();
    if (selectedPiece === null) {
      setSelectedPiece(piece);
      return;
    }

    if (selectedPiece === piece) {
      setSelectedPiece(null);
      return;
    }

    setPieces((currentPieces) => {
      const nextPieces = [...currentPieces];
      const selectedIndex = nextPieces.indexOf(selectedPiece);
      const targetIndex = nextPieces.indexOf(piece);
      [nextPieces[selectedIndex], nextPieces[targetIndex]] = [
        nextPieces[targetIndex],
        nextPieces[selectedIndex],
      ];
      return nextPieces;
    });
    setSelectedPiece(null);
  }

  return (
    <div className={styles.puzzle}>
      <p className={styles.instruction}>
        Select one paper piece, then another to swap their places.
      </p>
      <div className={styles.paper} role="group" aria-label="Four paper puzzle pieces">
        {pieces.map((piece, index) => (
          <button
            key={piece}
            className={`${styles.piece} ${selectedPiece === piece ? styles.selected : ""}`}
            type="button"
            aria-label={`${symbolNames[piece]} piece, position ${index + 1}`}
            aria-pressed={selectedPiece === piece}
            onClick={() => choosePiece(piece)}
          >
            <span className={styles.position}>{index + 1}</span>
            <span aria-hidden="true">{symbolMarks[piece]}</span>
          </button>
        ))}
      </div>
      <p className={styles.selection} aria-live="polite">
        {selectedPiece
          ? `${symbolNames[selectedPiece]} selected. Choose another piece to swap.`
          : "Use the wall guide to choose the right order."}
      </p>
      <button
        className={styles.submitButton}
        type="button"
        onClick={() => onSubmit(pieces.join("-"))}
      >
        Check paper order
      </button>
    </div>
  );
}
