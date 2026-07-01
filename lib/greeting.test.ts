import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns morning before noon", () => {
    expect(getGreeting(9)).toBe("Good morning");
  });

  it("returns afternoon between noon and 6pm", () => {
    expect(getGreeting(14)).toBe("Good afternoon");
  });

  it("returns evening from 6pm", () => {
    expect(getGreeting(20)).toBe("Good evening");
  });
});
