import { useCallback, useEffect, useRef } from "react";

export type BuddyLauncherDecision = {
  allowToggle: boolean;
  shouldShake: boolean;
  shouldActivate: boolean;
  pressCount: number;
};

export function useBuddyActivation(onActivate: () => void) {
  const clickTimesRef = useRef<number[]>([]);

  const resetActivation = useCallback(() => {
    clickTimesRef.current = [];
  }, []);

  const registerLauncherClick = useCallback((): BuddyLauncherDecision => {
    const now = Date.now();
    const recentClicks = clickTimesRef.current.filter((time) => now - time <= 4000);
    recentClicks.push(now);
    clickTimesRef.current = recentClicks;
    const pressCount = recentClicks.length;

    if (pressCount >= 5) {
      clickTimesRef.current = [];
      onActivate();
      return { allowToggle: false, shouldShake: false, shouldActivate: true, pressCount: 5 };
    }
    if (pressCount >= 2) {
      return { allowToggle: false, shouldShake: true, shouldActivate: false, pressCount };
    }
    return { allowToggle: true, shouldShake: false, shouldActivate: false, pressCount: 1 };
  }, [onActivate]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (clickTimesRef.current.length > 0 && now - clickTimesRef.current[0] > 4000) {
        clickTimesRef.current = [];
      }
    }, 250);
    return () => window.clearInterval(intervalId);
  }, []);

  return { registerLauncherClick, resetActivation };
}
