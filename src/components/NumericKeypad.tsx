"use client";

import { useState } from "react";
import styles from "./NumericKeypad.module.css";

interface NumericKeypadProps {
  onTap: () => void;
  onSubmit: (answer: string) => void;
}

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function NumericKeypad({ onSubmit, onTap }: NumericKeypadProps) {
  const [enteredDigits, setEnteredDigits] = useState<number[]>([]);
  const code = enteredDigits.join("");

  function appendDigit(digit: number) {
    setEnteredDigits((current) =>
      current.length < 4 ? [...current, digit] : current,
    );
  }

  return (
    <div className={styles.keypad}>
      <output
        className={styles.display}
        aria-label={`${enteredDigits.length} of 4 digits entered`}
        aria-live="polite"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} aria-hidden="true">
            {enteredDigits[index] ?? "·"}
          </span>
        ))}
      </output>

      <div className={styles.buttons} role="group" aria-label="Number keypad">
        {digits.map((digit) => (
          <button
            className={styles.key}
            key={digit}
            type="button"
            aria-label={`Digit ${digit}`}
            onClick={() => {
              onTap();
              appendDigit(digit);
            }}
          >
            {digit}
          </button>
        ))}
        <button
          className={styles.utilityKey}
          type="button"
          onClick={() => {
            onTap();
            setEnteredDigits([]);
          }}
        >
          Clear
        </button>
        <button
          className={styles.key}
          type="button"
          aria-label="Digit 0"
          onClick={() => {
            onTap();
            appendDigit(0);
          }}
        >
          0
        </button>
        <button
          className={styles.utilityKey}
          type="button"
          aria-label="Delete last digit"
          onClick={() => {
            onTap();
            setEnteredDigits((current) => current.slice(0, -1));
          }}
        >
          Delete
        </button>
      </div>

      <button
        className={styles.submitButton}
        type="button"
        disabled={enteredDigits.length !== 4}
        onClick={() => onSubmit(code)}
      >
        Unlock
      </button>
    </div>
  );
}
