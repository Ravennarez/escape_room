import {
  HINT_LIMIT,
  MISSION_DURATION_SECONDS,
  createInitialGameState,
  type GameState,
  type ItemId,
  type PuzzleId,
  type TargetId,
} from "./model";
import { isPuzzleAvailable, isTargetAvailable } from "./rules";

export const STORAGE_KEY = "afterimage-archive-paper-box-save";
const SAVE_VERSION = 3;
const LEGACY_SAVE_VERSION = 1;
const PREVIOUS_SAVE_VERSION = 2;

const statuses = ["ready", "playing", "opening", "won", "lost"] as const;
const items = ["brass-key"] as const;
const removedPaperItems = [
  "paper-triangle",
  "paper-circle",
  "paper-square",
  "paper-diamond",
] as const;
const targets = [
  "paper-puzzle",
  "assembly-clue",
  "light-switch",
  "key-box",
  "table-box",
  "exit-panel",
] as const;
const puzzles = ["paper-assembly", "exit-code"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is T => allowed.includes(entry as T)) &&
    new Set(value).size === value.length
  );
}

function isNullableTimestamp(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function hasValidShape(value: unknown): value is GameState {
  if (!isRecord(value)) return false;

  const isValidFeedback =
    value.feedback === null ||
    (isRecord(value.feedback) &&
      ["success", "error", "info"].includes(String(value.feedback.kind)) &&
      typeof value.feedback.message === "string");

  return (
    statuses.includes(value.status as (typeof statuses)[number]) &&
    isNullableTimestamp(value.startedAtMs) &&
    isNullableTimestamp(value.deadlineAtMs) &&
    isStringArray<ItemId>(value.inventory, items) &&
    isStringArray<TargetId>(value.discoveredTargets, targets) &&
    isStringArray<ItemId>(value.usedItems, items) &&
    isStringArray<PuzzleId>(value.solvedPuzzles, puzzles) &&
    isStringArray<PuzzleId>(value.hintedPuzzles, puzzles) &&
    typeof value.hintsRemaining === "number" &&
    Number.isInteger(value.hintsRemaining) &&
    value.hintsRemaining >= 0 &&
    value.hintsRemaining <= HINT_LIMIT &&
    isValidFeedback
  );
}

export function isGameState(value: unknown): value is GameState {
  if (!hasValidShape(value)) return false;

  const { status, startedAtMs, deadlineAtMs } = value;
  if (status === "ready") {
    return (
      startedAtMs === null &&
      deadlineAtMs === null &&
      value.inventory.length === 0 &&
      value.discoveredTargets.length === 0 &&
      value.usedItems.length === 0 &&
      value.solvedPuzzles.length === 0 &&
      value.hintedPuzzles.length === 0 &&
      value.hintsRemaining === HINT_LIMIT
    );
  }

  if (
    startedAtMs === null ||
    deadlineAtMs !== startedAtMs + MISSION_DURATION_SECONDS * 1000 ||
    value.hintsRemaining + value.hintedPuzzles.length !== HINT_LIMIT
  ) {
    return false;
  }

  if (
    value.discoveredTargets.some((target) => !isTargetAvailable(value, target)) ||
    value.solvedPuzzles.some((puzzle) => !isPuzzleAvailable(value, puzzle)) ||
    value.hintedPuzzles.some((puzzle) => !isPuzzleAvailable(value, puzzle)) ||
    value.usedItems.some((item) => !value.inventory.includes(item))
  ) {
    return false;
  }

  if (
    (value.solvedPuzzles.includes("paper-assembly") &&
      (!value.discoveredTargets.includes("paper-puzzle") ||
        !value.discoveredTargets.includes("assembly-clue"))) ||
    (value.inventory.includes("brass-key") &&
      (!value.solvedPuzzles.includes("paper-assembly") ||
        !value.discoveredTargets.includes("key-box"))) ||
    (value.usedItems.includes("brass-key") &&
      !value.discoveredTargets.includes("table-box"))
  ) {
    return false;
  }

  const hasWon = value.solvedPuzzles.includes("exit-code");
  return status === "opening" || status === "won" ? hasWon : !hasWon;
}

export function parseSavedGame(raw: string): GameState | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    return null;
  }

  const state = parsed.version === SAVE_VERSION
    ? migrateCurrentState(parsed.state)
    : parsed.version === LEGACY_SAVE_VERSION ||
        parsed.version === PREVIOUS_SAVE_VERSION
      ? migratePreviousState(parsed.state)
      : parsed.state;

  if (
    (parsed.version !== SAVE_VERSION &&
      parsed.version !== LEGACY_SAVE_VERSION &&
      parsed.version !== PREVIOUS_SAVE_VERSION) ||
    !isGameState(state)
  ) {
    return null;
  }
  return state;
}

function migrateCurrentState(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.inventory)) {
    return value;
  }

  const savedFeedback = value.feedback;
  let shouldClearFeedback = false;
  if (isRecord(savedFeedback) && typeof savedFeedback.message === "string") {
    const message = savedFeedback.message;
    shouldClearFeedback = ["You collected the ", "You found the "].some(
      (prefix) => message.startsWith(prefix) && message.includes("paper piece"),
    );
  }

  return {
    ...value,
    inventory: value.inventory.filter(
      (item: unknown) => !removedPaperItems.some((removedItem) => removedItem === item),
    ),
    feedback: shouldClearFeedback ? null : savedFeedback,
  };
}

function migratePreviousState(value: unknown): unknown {
  return migrateLegacyState(value);
}

function migrateLegacyState(value: unknown): unknown {
  if (
    !isRecord(value) ||
    !Array.isArray(value.solvedPuzzles) ||
    !value.solvedPuzzles.includes("paper-assembly") ||
    !Array.isArray(value.discoveredTargets) ||
    value.discoveredTargets.includes("light-switch")
  ) {
    return value;
  }

  return {
    ...value,
    discoveredTargets: [...value.discoveredTargets, "light-switch"],
  };
}

export function serializeGame(state: GameState): string {
  return JSON.stringify({ version: SAVE_VERSION, state });
}

export function emptyGameState(): GameState {
  return createInitialGameState();
}
