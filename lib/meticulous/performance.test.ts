import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { capturePerformance } from "./performance";

beforeEach(() => {
  delete (window as Window).__perfMetrics;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  delete (window as Window).Meticulous;
  vi.restoreAllMocks();
});

describe("capturePerformance", () => {
  it("pushes a metric onto window.__perfMetrics", () => {
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { domContentLoadedEventEnd: 120, startTime: 20 } as unknown as PerformanceEntry,
    ]);
    capturePerformance();
    expect(window.__perfMetrics).toHaveLength(1);
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 100 });
  });

  it("uses window.performance directly (no native performance object exists)", () => {
    const perfSpy = vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { domContentLoadedEventEnd: 50, startTime: 10 } as unknown as PerformanceEntry,
    ]);
    window.Meticulous = { isRunningAsTest: true };
    capturePerformance();
    expect(perfSpy).toHaveBeenCalledWith("navigation");
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 40 });
  });
});
