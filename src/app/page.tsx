"use client";

import { MissionOverlay } from "@/components/MissionOverlay";
import { MobileLandscapePrompt } from "@/components/MobileLandscapePrompt";
import { RoomScene } from "@/components/RoomScene";
import { useGame } from "@/game/GameProvider";

export default function Home() {
  const { state } = useGame();
  if (state.status === "playing" || state.status === "opening") {
    return (
      <>
        <RoomScene />
        <MobileLandscapePrompt />
      </>
    );
  }

  return (
    <>
      <MissionOverlay />
      <MobileLandscapePrompt />
    </>
  );
}
