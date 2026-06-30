import { describe, it, expect, afterEach } from "vitest";
import { isReplay, isMeticulousBuild, nextDeterministicId } from "./replay";

afterEach(() => {
  delete (window as Window).Meticulous;
  delete process.env.METICULOUS_BUILD;
});

describe("isReplay", () => {
  it("is false when window.Meticulous is absent", () => {
    expect(isReplay()).toBe(false);
  });

  it("is true when isRunningAsTest is true", () => {
    window.Meticulous = { isRunningAsTest: true };
    expect(isReplay()).toBe(true);
  });
});

describe("isMeticulousBuild", () => {
  it("reflects the METICULOUS_BUILD env var", () => {
    expect(isMeticulousBuild()).toBe(false);
    process.env.METICULOUS_BUILD = "true";
    expect(isMeticulousBuild()).toBe(true);
  });
});

describe("nextDeterministicId", () => {
  it("returns a strictly increasing sequence", () => {
    const a = nextDeterministicId();
    const b = nextDeterministicId();
    expect(b).toBe(a + 1);
  });
});
