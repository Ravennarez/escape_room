"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { useMissionClock } from "@/hooks/useMissionClock";
import {
  createInitialGameState,
  type GameAction,
  type GameState,
} from "./model";
import { gameReducer } from "./reducer";
import { parseSavedGame, serializeGame, STORAGE_KEY } from "./persistence";

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  remainingSeconds: number | null;
  isHydrated: boolean;
  storageError: string | null;
}

interface StorageState {
  isHydrated: boolean;
  error: string | null;
}

type StorageAction =
  | { type: "HYDRATION_COMPLETE" }
  | { type: "STORAGE_ERROR"; message: string };

const GameContext = createContext<GameContextValue | null>(null);

function storageReducer(
  state: StorageState,
  action: StorageAction,
): StorageState {
  switch (action.type) {
    case "HYDRATION_COMPLETE":
      return { ...state, isHydrated: true };
    case "STORAGE_ERROR":
      return { ...state, error: action.message };
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [storage, storageDispatch] = useReducer(storageReducer, {
    isHydrated: false,
    error: null,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        let restoredState: GameState | null;
        try {
          restoredState = parseSavedGame(saved);
        } catch {
          restoredState = null;
        }
        if (restoredState) {
          dispatch({ type: "RESTORE_GAME", state: restoredState, nowMs: Date.now() });
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          storageDispatch({
            type: "STORAGE_ERROR",
            message: "The saved game was invalid and has been cleared.",
          });
        }
      }
    } catch {
      storageDispatch({
        type: "STORAGE_ERROR",
        message: "Saved progress could not be read from this browser.",
      });
    } finally {
      storageDispatch({ type: "HYDRATION_COMPLETE" });
    }
  }, []);

  useEffect(() => {
    if (!storage.isHydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, serializeGame(state));
    } catch {
      storageDispatch({
        type: "STORAGE_ERROR",
        message: "Progress could not be saved. Check your browser storage settings.",
      });
    }
  }, [storage.isHydrated, state]);

  const remainingSeconds = useMissionClock({
    status: state.status,
    deadlineAtMs: state.deadlineAtMs,
    dispatch,
    enabled: storage.isHydrated,
  });

  const value = useMemo(
    () => ({
      state,
      dispatch,
      remainingSeconds,
      isHydrated: storage.isHydrated,
      storageError: storage.error,
    }),
    [state, remainingSeconds, storage],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used inside a GameProvider.");
  }
  return context;
}
