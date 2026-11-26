import styles from "./MobileLandscapePrompt.module.css";

export function MobileLandscapePrompt() {
  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label="Rotate your device to landscape to continue"
    >
      <div className={styles.card}>
        <svg
          className={styles.device}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <rect x="22" y="7" width="20" height="50" rx="4" />
          <rect className={styles.screen} x="25" y="13" width="14" height="34" rx="1" />
          <path d="M29 52h6" />
        </svg>
        <p className={styles.eyebrow}>MOBILE PLAY</p>
        <h2>Turn your phone sideways</h2>
        <p className={styles.description}>
          Afterimage Archive is designed for landscape. Rotate your device to continue.
        </p>
      </div>
    </div>
  );
}
