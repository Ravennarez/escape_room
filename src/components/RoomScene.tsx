"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { BrassKeyIcon } from "@/components/BrassKeyIcon";
import { Hotspot } from "@/components/Hotspot";
import { Inventory } from "@/components/Inventory";
import { PuzzlePanel } from "@/components/PuzzlePanel";
import {
  isAudioMuted,
  playItemTapSound,
  playTaskSuccessSound,
  setAudioMuted,
} from "@/game/audio";
import { useGame } from "@/game/GameProvider";
import { formatTime } from "@/game/formatTime";
import type { GameState, ItemId, PuzzleId, TargetId } from "@/game/model";
import {
  canCollectItem,
  canUseItem,
  getCollectibleItems,
  getItemName,
  isCorrectAnswer,
  isTargetAvailable,
} from "@/game/rules";
import styles from "./RoomScene.module.css";

interface RoomTarget {
  id: TargetId;
  label: string;
  x: number;
  y: number;
}

interface SpotlightStyle extends CSSProperties {
  "--light-x": string;
  "--light-y": string;
}

const roomTargets: readonly RoomTarget[] = [
  { id: "paper-puzzle", label: "Paper puzzle", x: 42, y: 71 },
  { id: "assembly-clue", label: "Wall guide", x: 48, y: 32 },
  { id: "light-switch", label: "Light switch", x: 76, y: 40 },
  { id: "key-box", label: "Rear key box", x: 26, y: 42 },
  { id: "table-box", label: "Locked table box", x: 65, y: 71 },
  { id: "exit-panel", label: "Exit panel", x: 92, y: 35 },
];

const targetPuzzles: Partial<Record<TargetId, PuzzleId>> = {
  "paper-puzzle": "paper-assembly",
  "exit-panel": "exit-code",
};

const targetDescriptions: Record<TargetId, { title: string; description: string }> = {
  "paper-puzzle": {
    title: "Paper puzzle",
    description: "Four torn paper pieces are scattered across the table beside a locked box.",
  },
  "assembly-clue": {
    title: "Wall guide",
    description: "The symbols on the guide read from left to right: triangle, circle, square, diamond.",
  },
  "light-switch": {
    title: "Light switch",
    description: "A wall switch controls the room lights. Flip it after solving the paper puzzle.",
  },
  "key-box": {
    title: "Rear key box",
    description: "A small wall box sits behind the worktable. Its latch is waiting to be opened.",
  },
  "table-box": {
    title: "Locked table box",
    description: "A sturdy box is locked shut. A brass keyhole is set into its front.",
  },
  "exit-panel": {
    title: "Exit panel",
    description: "The exit keypad waits for the four-digit code hidden in the table box.",
  },
};

function getTargetDescription(target: TargetId, state: GameState): string {
  if (
    target === "light-switch" &&
    state.discoveredTargets.includes("light-switch")
  ) {
    return "The switch is on. The room lights are back, and the rear key box is now accessible.";
  }
  if (
    target === "key-box" &&
    state.discoveredTargets.includes("key-box")
  ) {
    return "The rear key box is open. A brass key rests inside.";
  }
  if (target === "table-box" && state.usedItems.includes("brass-key")) {
    return "Inside the box is a note with the exit code: 1907.";
  }
  if (target === "paper-puzzle" && state.solvedPuzzles.includes("paper-assembly")) {
    return "The four pieces fit. Find the wall switch to turn on the room lights.";
  }
  return targetDescriptions[target].description;
}

export function RoomScene() {
  const { state, dispatch, remainingSeconds, storageError } = useGame();
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetId | null>(null);
  const [lightPosition, setLightPosition] = useState({ x: 50, y: 50 });
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(isAudioMuted);
  const roomRef = useRef<HTMLElement>(null);
  const isLightsOn = state.discoveredTargets.includes("light-switch");
  const isKeyBoxOpen = state.discoveredTargets.includes("key-box");
  const isBrassKeyCollected = state.inventory.includes("brass-key");

  useEffect(() => {
    if (state.status !== "opening") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeoutId = window.setTimeout(
      () => dispatch({ type: "FINISH_ESCAPE" }),
      prefersReducedMotion ? 0 : 1100,
    );

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, state.status]);

  const spotlightStyle: SpotlightStyle = {
    "--light-x": `${lightPosition.x}%`,
    "--light-y": `${lightPosition.y}%`,
  };

  function moveLightToElement(element: HTMLButtonElement) {
    const bounds = roomRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const targetBounds = element.getBoundingClientRect();
    setLightPosition({
      x: ((targetBounds.left + targetBounds.width / 2 - bounds.left) / bounds.width) * 100,
      y: ((targetBounds.top + targetBounds.height / 2 - bounds.top) / bounds.height) * 100,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    setSpotlightActive(true);
    const bounds = event.currentTarget.getBoundingClientRect();
    setLightPosition({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    setSpotlightActive(false);
    setLightPosition({ x: 50, y: 50 });
  }

  function handleTargetSelect(target: TargetId) {
    playItemTapSound();
    const roomTarget = roomTargets.find((candidate) => candidate.id === target);
    if (roomTarget) {
      setSpotlightActive(true);
      setLightPosition({ x: roomTarget.x, y: roomTarget.y });
    }
    setSelectedTarget(target);
    if (target === "light-switch") {
      setSelectedItem(null);
      if (
        isTargetAvailable(state, target) &&
        !state.discoveredTargets.includes(target)
      ) {
        playTaskSuccessSound();
      }
      dispatch({ type: "TURN_ON_LIGHTS" });
      return;
    }

    if (selectedItem) {
      const opensKeyBox =
        target === "key-box" &&
        isTargetAvailable(state, target) &&
        !state.discoveredTargets.includes(target);
      if (
        isTargetAvailable(state, target) &&
        !state.discoveredTargets.includes(target)
      ) {
        dispatch({ type: "INSPECT_TARGET", target });
      }
      const allowed = canUseItem(state, selectedItem, target);
      dispatch({ type: "USE_ITEM", item: selectedItem, target });
      if (allowed || opensKeyBox) playTaskSuccessSound();
      if (allowed) setSelectedItem(null);
      return;
    }

    if (
      target === "key-box" &&
      isTargetAvailable(state, target) &&
      !state.discoveredTargets.includes(target)
    ) {
      playTaskSuccessSound();
    }
    dispatch({ type: "INSPECT_TARGET", target });
  }

  function handleItemSelect(item: ItemId) {
    playItemTapSound();
    setSelectedItem((current) => (current === item ? null : item));
  }

  function toggleSound() {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    setAudioMuted(nextMuted);
  }

  const inspectionTarget = state.status === "opening" ? null : selectedTarget;
  const selectedDetails = inspectionTarget
    ? targetDescriptions[inspectionTarget]
    : null;
  const selectedPuzzle = inspectionTarget
    ? targetPuzzles[inspectionTarget] ?? null
    : null;
  const collectibles = inspectionTarget
    ? getCollectibleItems(state, inspectionTarget)
    : [];
  const isOpenTableBox =
    inspectionTarget === "table-box" && state.usedItems.includes("brass-key");

  return (
    <main className={styles.mission}>
      <header className={styles.topbar}>
        <div className={styles.missionStats}>
          <div className={styles.timerBlock}>
            <span className={styles.statIcon} aria-hidden="true">◷</span>
            <div>
              <span className={styles.statLabel}>TIME LEFT</span>
              <strong>{remainingSeconds === null ? "--:--" : formatTime(remainingSeconds)}</strong>
            </div>
          </div>
          <div className={styles.hintBlock}>
            <span className={styles.hintPip} aria-hidden="true">✦</span>
            <div>
              <span className={styles.statLabel}>HINTS</span>
              <strong>{state.hintsRemaining}<span> / 3</span></strong>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.restartButton}
            onClick={() => dispatch({ type: "RESTART_MISSION" })}
            aria-label="Restart mission"
          >
            <span aria-hidden="true">↻</span>
            <span>Restart</span>
          </button>
          <button
            type="button"
            className={styles.soundButton}
            onClick={toggleSound}
            aria-label={isSoundMuted ? "Unmute sound" : "Mute sound"}
            aria-pressed={isSoundMuted}
            title={isSoundMuted ? "Unmute sound" : "Mute sound"}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              {isSoundMuted ? (
                <path d="m16 9 5 6m0-6-5 6" />
              ) : (
                <>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a10 10 0 0 1 0 14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.roomColumn} aria-labelledby="room-heading">
          <div className={styles.sceneHeading}>
            <div>
              <p className={styles.eyebrow}>ROOM 01 <span>/</span> SEALED DARKROOM</p>
              <h1 id="room-heading">Find a way out</h1>
            </div>
            <p className={styles.sceneHelp}>Tap an object to reveal and inspect it.</p>
          </div>

          <section
            className={[
              styles.scene,
              isLightsOn ? styles.roomLightsOn : "",
              spotlightActive ? styles.spotlightActive : "",
            ].filter(Boolean).join(" ")}
            style={spotlightStyle}
            ref={roomRef}
            aria-label="Illustrated darkroom with selectable objects"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div className={styles.roomTexture} aria-hidden="true" />
            <div className={styles.wallSeam} aria-hidden="true" />
            <div className={styles.ceilingLight} aria-hidden="true"><i /></div>
            <div className={styles.shelf} aria-hidden="true">
              <span className={styles.bookStack}><i /><i /><i /><i /></span>
              <span className={styles.shelfJar} />
              <span className={styles.shelfPlant}><i /><i /><i /></span>
            </div>
            <div className={styles.clueBoard} aria-hidden="true">
              <div className={styles.boardShapes}><i /><i /><i /><i /></div>
              <div className={styles.boardColumns}>
                <span><i /><i /><i /></span>
                <span><i /><i /><i /></span>
                <span><i /><i /><i /></span>
                <span><i /><i /><i /></span>
              </div>
            </div>
            <div
              className={`${styles.rearKeyBox} ${isKeyBoxOpen ? styles.rearKeyBoxOpen : ""}`}
              aria-hidden="true"
            >
              <div className={styles.rearKeyBoxInterior} />
              {!isBrassKeyCollected && (
                <BrassKeyIcon className={styles.rearKeyBoxKey} />
              )}
              <div
                className={`${styles.rearKeyBoxLid} ${isKeyBoxOpen ? styles.rearKeyBoxLidOpen : ""}`}
              >
                <span className={styles.rearKeyBoxHandle} />
              </div>
            </div>
            <div
              className={`${styles.lightSwitch} ${isLightsOn ? styles.lightSwitchOn : ""}`}
              aria-hidden="true"
            />
            <div className={styles.dryingLine} aria-hidden="true">
              <i /><i /><i />
            </div>
            <div className={styles.exitSign} aria-hidden="true">EXIT <span>→</span></div>
            <div
              className={`${styles.doorway} ${state.status === "opening" ? styles.doorwayOpen : ""}`}
              aria-hidden="true"
            />
            <div
              className={`${styles.door} ${state.status === "opening" ? styles.doorOpen : ""}`}
              aria-hidden="true"
            >
              <span className={styles.doorHandle} />
              <span className={styles.doorKeypad}><i /><i /><i /><i /><i /><i /></span>
            </div>
            <div className={styles.counter} aria-hidden="true" />
            <div className={styles.plantPot} aria-hidden="true">
              <i /><i /><i /><span />
            </div>
            <div className={styles.paperSheet} aria-hidden="true">
              <span>◇</span><span>○</span><span>△</span><span>□</span>
            </div>
            <div className={styles.sink} aria-hidden="true"><span /></div>
            <div className={`${styles.tableBox} ${state.usedItems.includes("brass-key") ? styles.tableBoxOpen : ""}`} aria-hidden="true">
              <i />
              <span className={styles.codeNote}>1907</span>
            </div>
            <div className={styles.sceneCaption} aria-hidden="true">
              <span>AFTERIMAGE ARCHIVE <i>/</i> PLATE 01</span>
              <span>{isLightsOn ? "ROOM LIGHTS ON" : "LIGHTS OUT"}</span>
            </div>
            {state.status === "opening" && (
              <div
                className={styles.escapeSuccess}
                role="status"
                aria-live="assertive"
                aria-atomic="true"
              >
                <span className={styles.escapeSuccessMark} aria-hidden="true">✓</span>
                <span>
                  <span className={styles.escapeSuccessLabel}>MISSION COMPLETE</span>
                  <strong>YOU ESCAPED</strong>
                </span>
              </div>
            )}

            {roomTargets.map((target) => (
              <Hotspot
                key={target.id}
                label={target.label}
                x={target.x}
                y={target.y}
                locked={!isTargetAvailable(state, target.id)}
                discovered={state.discoveredTargets.includes(target.id)}
                selected={selectedTarget === target.id}
                onClick={() => handleTargetSelect(target.id)}
                onFocus={(event) => moveLightToElement(event.currentTarget)}
              />
            ))}
          </section>

          <section
            className={[
              styles.inspection,
              selectedPuzzle ? styles.inspectionPuzzle : "",
              selectedPuzzle === "exit-code" ? styles.inspectionKeypad : "",
              isOpenTableBox ? styles.inspectionTableBox : "",
              !selectedDetails ? styles.inspectionEmpty : "",
            ].filter(Boolean).join(" ")}
            id="target-inspection"
            aria-label="Object inspection details"
            aria-live="polite"
          >
            {selectedDetails ? (
              <>
                <div className={styles.inspectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>OBJECT FILE</p>
                    <h2 id="inspection-title">{selectedDetails.title}</h2>
                  </div>
                  <button
                    className={styles.closeInspectionButton}
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    aria-label="Close object inspection"
                    title="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <p className={styles.objectDescription}>
                  {selectedTarget && !isTargetAvailable(state, selectedTarget)
                    ? "The way is blocked. Find what this mechanism is missing."
                    : selectedTarget && !state.discoveredTargets.includes(selectedTarget)
                      ? "This shape is hidden in the dark. Examine it to bring its details into view."
                      : selectedTarget
                        ? getTargetDescription(selectedTarget, state)
                        : selectedDetails.description}
                </p>
                {selectedPuzzle && (
                  <PuzzlePanel
                    puzzle={selectedPuzzle}
                    state={state}
                    onTap={playItemTapSound}
                    onSpendHint={(puzzle) =>
                      dispatch({ type: "SPEND_HINT", puzzle })
                    }
                    onSubmit={(answer) => {
                      playItemTapSound();
                      if (isCorrectAnswer(selectedPuzzle, answer)) {
                        playTaskSuccessSound();
                      }
                      dispatch({
                        type: "SUBMIT_ANSWER",
                        puzzle: selectedPuzzle,
                        answer,
                      });
                    }}
                  />
                )}
                {collectibles.map((item) => (
                  <button
                    className={styles.collectButton}
                    type="button"
                    key={item}
                    onClick={() => {
                      playItemTapSound();
                      if (canCollectItem(state, item)) playTaskSuccessSound();
                      dispatch({ type: "COLLECT_ITEM", item });
                    }}
                  >
                    Take {getItemName(item).toLowerCase()}
                  </button>
                ))}
              </>
            ) : (
              <p className={styles.emptyInspection}>
                Choose an object in the room to inspect it. The light follows your pointer or keyboard focus.
              </p>
            )}
          </section>
        </section>

        <Inventory
          items={state.inventory}
          selectedItem={selectedItem}
          onSelectItem={handleItemSelect}
        />
      </div>

      <footer className={styles.footer}>
        <span>FIELD NOTES <span>/</span> 01</span>
        <span>{state.discoveredTargets.length.toString().padStart(2, "0")} OBJECTS EXAMINED</span>
      </footer>
      {storageError && (
        <p className={styles.storageError} role="alert">{storageError}</p>
      )}
    </main>
  );
}
