"use client";

import { useEffect } from "react";
import { useGame } from "@/game/GameProvider";
import { startAmbientAudio, stopAmbientAudio } from "@/game/audio";
import { formatTime } from "@/game/formatTime";
import { MISSION_DURATION_SECONDS } from "@/game/model";
import styles from "./MissionOverlay.module.css";

export function MissionOverlay() {
  const {
    state,
    dispatch,
    remainingSeconds,
    isHydrated,
    storageError,
  } = useGame();

  useEffect(() => {
    stopAmbientAudio();
  }, [state.status]);

  const isWon = state.status === "won";
  const isLost = state.status === "lost";
  const statusLabel = isWon
    ? "Mission complete"
    : isLost
      ? "Time expired"
      : "Mission ready";
  const title = isWon
    ? "You made it out."
    : isLost
      ? "The last safe-light fades."
      : "Some things only appear\nwhen you look closer.";
  const description = isWon
    ? "The code from the table box released the exit. The room lights are on, and you are out."
    : isLost
      ? "The room stayed dark and the exit sealed before you found the code. You can try again."
    : "You wake in a sealed darkroom. Arrange the paper pieces, then flip the wall switch yourself. The rear box holds a key for the table box, where the exit code is hidden.";

  function startOrRestart() {
    startAmbientAudio();
    if (state.status === "ready") {
      dispatch({ type: "START_MISSION", nowMs: Date.now() });
      return;
    }

    dispatch({ type: "RESTART_MISSION" });
    dispatch({ type: "START_MISSION", nowMs: Date.now() });
  }

  const seconds = state.status === "ready"
    ? MISSION_DURATION_SECONDS
    : remainingSeconds ?? 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>AFTERIMAGE <span>ARCHIVE</span></p>
        <p className={styles.eyebrow}>A photographic darkroom escape</p>
      </header>

      <section
        className={`${styles.card} ${isWon ? styles.won : ""} ${isLost ? styles.lost : ""}`}
        aria-labelledby="mission-title"
      >
        <div className={styles.cardTopline}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>{isHydrated ? statusLabel : "Restoring your archive..."}</span>
          <span className={styles.missionNumber}>MISSION 01</span>
        </div>

        <div className={styles.content}>
          <p className={styles.kicker}>
            {isWon ? "THE ARCHIVE IS BEHIND YOU" : isLost ? "THE CLOCK RAN OUT" : "THE ROOM IS DARK"}
          </p>
          <h1 id="mission-title">{title}</h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.missionBar}>
            <div>
              <span className={styles.metaLabel}>TIME REMAINING</span>
              <strong className={styles.timer} aria-live="off">
                {formatTime(seconds)}
              </strong>
            </div>
            <div className={styles.missionState}>
              <span className={styles.metaLabel}>HINTS</span>
              <strong>{state.hintsRemaining} <span className={styles.muted}>/ 3</span></strong>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              disabled={!isHydrated}
              onClick={startOrRestart}
            >
              {state.status === "ready" ? "Enter the darkroom" : "Play again"}
              <span aria-hidden="true">{state.status === "ready" ? "→" : "↻"}</span>
            </button>
            <p className={styles.saveNote}>
              {isHydrated
                ? "Progress saves automatically on this device."
                : "Checking saved progress..."}
            </p>
          </div>
        </div>
      </section>

      {storageError && <p className={styles.storageError} role="alert">{storageError}</p>}

      <footer className={styles.footer}>
        <span>FIELD NOTES <span className={styles.footerDivider}>/</span> 01</span>
        <span>{isWon ? "MISSION COMPLETE" : isLost ? "MISSION FAILED" : "12 MINUTES UNTIL THE ARCHIVE LOCKS"}</span>
      </footer>

    </main>
  );
}
