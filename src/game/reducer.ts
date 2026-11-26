import {
  HINT_LIMIT,
  MISSION_DURATION_SECONDS,
  createInitialGameState,
  type Feedback,
  type GameAction,
  type GameState,
  type PuzzleId,
} from "./model";
import {
  canCollectItem,
  canUseItem,
  getItemName,
  isCorrectAnswer,
  isPuzzleAvailable,
  isTargetAvailable,
  getPuzzleHint,
} from "./rules";
import { isGameState } from "./persistence";

const MISSION_DURATION_MS = MISSION_DURATION_SECONDS * 1000;
const LEGACY_STARTUP_MESSAGE =
  "Arrange the paper puzzle, then flip the wall switch.";
const LEGACY_INSPECTION_MESSAGES = new Set([
  LEGACY_STARTUP_MESSAGE,
  "Flip the switch to turn on the room lights.",
  "That area is still inaccessible.",
  "You found something worth examining.",
  "You open the rear key box. A brass key is inside.",
]);

function feedback(
  state: GameState,
  kind: Feedback["kind"],
  message: string,
): GameState {
  return { ...state, feedback: { kind, message } };
}

function isActive(state: GameState): boolean {
  return state.status === "playing";
}

function solvePuzzle(state: GameState, puzzle: PuzzleId): GameState {
  const solvedPuzzles = [...state.solvedPuzzles, puzzle];
  if (puzzle === "exit-code") {
    return {
      ...state,
      solvedPuzzles,
      status: "opening",
      feedback: null,
    };
  }

  return {
    ...state,
    solvedPuzzles,
    feedback: {
      kind: "success",
      message: "The paper pieces fit. Find the wall switch to turn on the lights.",
    },
  };
}

export function gameReducer(
  state: GameState,
  action: GameAction,
): GameState {
  switch (action.type) {
    case "START_MISSION":
      if (state.status !== "ready") return state;
      return {
        ...createInitialGameState(),
        status: "playing",
        startedAtMs: action.nowMs,
        deadlineAtMs: action.nowMs + MISSION_DURATION_MS,
      };

    case "RESTORE_GAME":
      if (!isGameState(action.state)) {
        return feedback(state, "error", "Saved progress was invalid and could not be restored.");
      }
      if (
        action.state.status === "playing" &&
        action.state.deadlineAtMs !== null &&
        action.nowMs >= action.state.deadlineAtMs
      ) {
        return {
          ...action.state,
          status: "lost",
          feedback: { kind: "error", message: "Time ran out while you were away." },
        };
      }
      if (
        action.state.feedback &&
        LEGACY_INSPECTION_MESSAGES.has(action.state.feedback.message)
      ) {
        return { ...action.state, feedback: null };
      }
      return action.state;

    case "SYNC_CLOCK":
      if (
        isActive(state) &&
        state.deadlineAtMs !== null &&
        action.nowMs >= state.deadlineAtMs
      ) {
        return {
          ...state,
          status: "lost",
          feedback: { kind: "error", message: "Time is up. The archive is sealed." },
        };
      }
      return state;

    case "INSPECT_TARGET":
      if (!isActive(state)) return state;
      if (action.target === "light-switch") return { ...state, feedback: null };
      if (!isTargetAvailable(state, action.target)) return { ...state, feedback: null };
      if (state.discoveredTargets.includes(action.target)) {
        return { ...state, feedback: null };
      }
      return {
        ...state,
        discoveredTargets: [...state.discoveredTargets, action.target],
        feedback: null,
      };

    case "TURN_ON_LIGHTS":
      if (!isActive(state)) return state;
      if (!isTargetAvailable(state, "light-switch")) {
        return feedback(state, "error", "Solve the paper puzzle before using the light switch.");
      }
      if (state.discoveredTargets.includes("light-switch")) return state;
      return {
        ...state,
        discoveredTargets: [...state.discoveredTargets, "light-switch"],
        feedback: {
          kind: "success",
          message: "You flip the switch. The lights come on, revealing the rear key box.",
        },
      };

    case "COLLECT_ITEM":
      if (!isActive(state)) return state;
      if (!canCollectItem(state, action.item)) {
        return feedback(state, "error", "You can’t collect that item yet.");
      }
      return {
        ...state,
        inventory: [...state.inventory, action.item],
        feedback: {
          kind: "success",
          message: `You found the ${getItemName(action.item).toLowerCase()}.`,
        },
      };

    case "USE_ITEM":
      if (!isActive(state)) return state;
      if (
        !state.discoveredTargets.includes(action.target) ||
        !canUseItem(state, action.item, action.target)
      ) {
        return feedback(state, "error", "That item can’t be used there yet.");
      }
      return {
        ...state,
        usedItems: [...state.usedItems, action.item],
        feedback: {
          kind: "success",
          message: "The key opens the table box. A note inside reveals the exit code.",
        },
      };

    case "SUBMIT_ANSWER":
      if (!isActive(state)) return state;
      if (state.solvedPuzzles.includes(action.puzzle)) return state;
      if (!isPuzzleAvailable(state, action.puzzle)) {
        return feedback(state, "error", "You haven’t uncovered this puzzle yet.");
      }
      if (!isCorrectAnswer(action.puzzle, action.answer)) {
        return feedback(state, "error", "That doesn’t work. Recheck the clues.");
      }
      return solvePuzzle(state, action.puzzle);

    case "FINISH_ESCAPE":
      if (
        state.status !== "opening" ||
        !state.solvedPuzzles.includes("exit-code")
      ) {
        return state;
      }
      return { ...state, status: "won" };

    case "SPEND_HINT":
      if (!isActive(state)) return state;
      if (state.hintsRemaining <= 0) {
        return feedback(state, "error", "You’ve used all of your hints.");
      }
      if (!isPuzzleAvailable(state, action.puzzle)) {
        return feedback(state, "error", "There’s no hint for that puzzle yet.");
      }
      if (state.solvedPuzzles.includes(action.puzzle)) {
        return feedback(state, "info", "This mechanism is already solved.");
      }
      if (state.hintedPuzzles.includes(action.puzzle)) {
        return feedback(state, "info", "You’ve already used a hint for this puzzle.");
      }
      return {
        ...state,
        hintsRemaining: state.hintsRemaining - 1,
        hintedPuzzles: [...state.hintedPuzzles, action.puzzle],
        feedback: {
          kind: "info",
          message: getPuzzleHint(action.puzzle),
        },
      };

    case "RESTART_MISSION":
      return createInitialGameState();
  }
}

export const initialGameState = createInitialGameState();
export const maximumHints = HINT_LIMIT;
