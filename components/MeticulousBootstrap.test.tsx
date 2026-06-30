import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import MeticulousBootstrap from "./MeticulousBootstrap";
import { isAuthenticated } from "@/lib/auth";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  delete (window as Window).Meticulous;
  vi.restoreAllMocks();
});

describe("MeticulousBootstrap", () => {
  it("injects auth and captures perf on mount during replay", () => {
    window.Meticulous = { isRunningAsTest: true };
    render(<MeticulousBootstrap />);
    expect(isAuthenticated()).toBe(true);
    expect(window.__perfMetrics?.length).toBeGreaterThanOrEqual(1);
  });
});
