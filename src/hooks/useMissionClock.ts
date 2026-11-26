"use client";

import { useEffect, useState } from "react";
import type { Dispatch } from "react";
import type { GameAction, GameStatus } from "@/game/model";

interface UseMissionClockOptions {
  status: GameStatus;
  deadlineAtMs: number | null;
  dispatch: Dispatch<GameAction>;
  enabled: boolean;
}

export function useMissionClock({
  status,
  deadlineAtMs,
  dispatch,
  enabled,
}: UseMissionClockOptions): number | null {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const sync = () => {
      const currentTime = Date.now();
      setNowMs(currentTime);
      dispatch({ type: "SYNC_CLOCK", nowMs: currentTime });
    };

    const initialSyncId = window.setTimeout(sync, 0);
    if (status !== "playing") {
      return () => window.clearTimeout(initialSyncId);
    }

    const intervalId = window.setInterval(sync, 1000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearTimeout(initialSyncId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [deadlineAtMs, dispatch, enabled, status]);

  if (!enabled || deadlineAtMs === null || status === "ready") {
    return 0;
  }
  if (status === "lost") return 0;
  if (nowMs === 0) return null;

  return Math.max(0, Math.ceil((deadlineAtMs - nowMs) / 1000));
}
