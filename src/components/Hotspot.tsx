"use client";

import type { CSSProperties, FocusEventHandler, MouseEventHandler } from "react";
import styles from "./Hotspot.module.css";

interface HotspotProps {
  label: string;
  x: number;
  y: number;
  locked: boolean;
  discovered: boolean;
  selected: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  onFocus: FocusEventHandler<HTMLButtonElement>;
}

export function Hotspot({
  label,
  x,
  y,
  locked,
  discovered,
  selected,
  onClick,
  onFocus,
}: HotspotProps) {
  const hotspotStyle = {
    left: `${x}%`,
    top: `${y}%`,
  } satisfies CSSProperties;

  const status = locked ? "inaccessible" : discovered ? "examined" : "unexamined";
  const className = [
    styles.hotspot,
    locked ? styles.locked : "",
    selected ? styles.selected : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      className={className}
      style={hotspotStyle}
      type="button"
      aria-label={`${label}, ${status}`}
      aria-pressed={selected}
      aria-controls="target-inspection"
      onClick={onClick}
      onFocus={onFocus}
    >
      {!discovered && (
        <>
          <span className={styles.marker} aria-hidden="true">?</span>
          <span className={styles.label}>{label}</span>
        </>
      )}
    </button>
  );
}
