export const MISSION_DURATION_SECONDS = 12 * 60;
export const HINT_LIMIT = 3;

export type GameStatus = "ready" | "playing" | "opening" | "won" | "lost";

export type PuzzleId =
  | "paper-assembly"
  | "exit-code";

export type ItemId = "brass-key";

export type TargetId =
  | "paper-puzzle"
  | "assembly-clue"
  | "light-switch"
  | "key-box"
  | "table-box"
  | "exit-panel";

export type FeedbackKind = "success" | "error" | "info";

export interface Feedback {
  kind: FeedbackKind;
  message: string;
}

export interface GameState {
  status: GameStatus;
  startedAtMs: number | null;
  deadlineAtMs: number | null;
  inventory: ItemId[];
  discoveredTargets: TargetId[];
  usedItems: ItemId[];
  solvedPuzzles: PuzzleId[];
  hintedPuzzles: PuzzleId[];
  hintsRemaining: number;
  feedback: Feedback | null;
}

export type GameAction =
  | { type: "START_MISSION"; nowMs: number }
  | { type: "RESTORE_GAME"; state: GameState; nowMs: number }
  | { type: "INSPECT_TARGET"; target: TargetId }
  | { type: "TURN_ON_LIGHTS" }
  | { type: "COLLECT_ITEM"; item: ItemId }
  | { type: "USE_ITEM"; item: ItemId; target: TargetId }
  | { type: "SUBMIT_ANSWER"; puzzle: PuzzleId; answer: string }
  | { type: "FINISH_ESCAPE" }
  | { type: "SPEND_HINT"; puzzle: PuzzleId }
  | { type: "SYNC_CLOCK"; nowMs: number }
  | { type: "RESTART_MISSION" };

export function createInitialGameState(): GameState {
  return {
    status: "ready",
    startedAtMs: null,
    deadlineAtMs: null,
    inventory: [],
    discoveredTargets: [],
    usedItems: [],
    solvedPuzzles: [],
    hintedPuzzles: [],
    hintsRemaining: HINT_LIMIT,
    feedback: null,
  };
}
