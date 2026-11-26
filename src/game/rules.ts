import type { GameState, ItemId, PuzzleId, TargetId } from "./model";

const puzzleAnswers: Record<PuzzleId, string> = {
  "paper-assembly": "triangle-circle-square-diamond",
  "exit-code": "1907",
};

const puzzleHints: Record<PuzzleId, string> = {
  "paper-assembly": "The wall guide shows the paper order: triangle, circle, square, then diamond.",
  "exit-code": "The four-digit release code is written on the note inside the opened table box.",
};

const itemLocations: Record<ItemId, TargetId> = {
  "brass-key": "key-box",
};

const itemNames: Record<ItemId, string> = {
  "brass-key": "Brass key",
};

export function hasSolved(state: GameState, puzzle: PuzzleId): boolean {
  return state.solvedPuzzles.includes(puzzle);
}

export function isTargetAvailable(
  state: GameState,
  target: TargetId,
): boolean {
  switch (target) {
    case "paper-puzzle":
    case "assembly-clue":
    case "table-box":
      return true;
    case "key-box":
      return (
        hasSolved(state, "paper-assembly") &&
        state.discoveredTargets.includes("light-switch")
      );
    case "light-switch":
      return hasSolved(state, "paper-assembly");
    case "exit-panel":
      return state.usedItems.includes("brass-key");
  }
}

export function isPuzzleAvailable(
  state: GameState,
  puzzle: PuzzleId,
): boolean {
  switch (puzzle) {
    case "paper-assembly":
      return (
        state.discoveredTargets.includes("paper-puzzle") &&
        state.discoveredTargets.includes("assembly-clue")
      );
    case "exit-code":
      return (
        state.usedItems.includes("brass-key") &&
        state.discoveredTargets.includes("exit-panel")
      );
  }
}

export function canCollectItem(state: GameState, item: ItemId): boolean {
  return (
    !state.inventory.includes(item) &&
    state.discoveredTargets.includes(itemLocations[item]) &&
    hasSolved(state, "paper-assembly")
  );
}

export function getCollectibleItems(
  state: GameState,
  target: TargetId,
): ItemId[] {
  return (Object.keys(itemLocations) as ItemId[]).filter(
    (item) => itemLocations[item] === target && canCollectItem(state, item),
  );
}

export function getItemName(item: ItemId): string {
  return itemNames[item];
}

export function canUseItem(
  state: GameState,
  item: ItemId,
  target: TargetId,
): boolean {
  return (
    state.inventory.includes(item) &&
    !state.usedItems.includes(item) &&
    item === "brass-key" &&
    target === "table-box" &&
    isTargetAvailable(state, target)
  );
}

export function isCorrectAnswer(
  puzzle: PuzzleId,
  answer: string,
): boolean {
  return answer.trim().toLowerCase() === puzzleAnswers[puzzle];
}

export function getPuzzleHint(puzzle: PuzzleId): string {
  return puzzleHints[puzzle];
}
