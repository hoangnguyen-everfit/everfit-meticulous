// True when the app is running inside a Meticulous replay (client only).
export function isReplay(): boolean {
  return (
    typeof window !== "undefined" &&
    window.Meticulous?.isRunningAsTest === true
  );
}

// True at build/server time when this is a Meticulous test build.
export function isMeticulousBuild(): boolean {
  return process.env.METICULOUS_BUILD === "true";
}

// Monotonic counter used to keep replays deterministic (avoids Date.now()).
let deterministicCounter = 100000;
export function nextDeterministicId(): number {
  deterministicCounter += 1;
  return deterministicCounter;
}
