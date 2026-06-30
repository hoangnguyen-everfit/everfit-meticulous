import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { capturePerformance } from "./performance";

beforeEach(() => {
  delete (window as Window).__perfMetrics;
  delete (window as Window).Meticulous;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("capturePerformance", () => {
  it("uses window.performance when not in a benchmarkable replay", () => {
    const perfSpy = vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { domContentLoadedEventEnd: 120, startTime: 20 } as unknown as PerformanceEntry,
    ]);

    capturePerformance();

    expect(perfSpy).toHaveBeenCalledWith("navigation");
    expect(window.__perfMetrics).toHaveLength(1);
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 100 });
  });

  it("uses window.Meticulous.replay.native.performance when isBenchmarkableReplay is true", () => {
    const nativePerf = {
      getEntriesByType: vi.fn().mockReturnValue([
        { domContentLoadedEventEnd: 50, startTime: 10 } as unknown as PerformanceEntry,
      ]),
    } as unknown as Performance;

    window.Meticulous = {
      replay: {
        isBenchmarkableReplay: true,
        native: { performance: nativePerf },
      },
    };

    capturePerformance();

    expect(nativePerf.getEntriesByType).toHaveBeenCalledWith("navigation");
    expect(window.__perfMetrics).toHaveLength(1);
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 40 });
  });

  it("falls back to window.performance when isBenchmarkableReplay is false", () => {
    const perfSpy = vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { domContentLoadedEventEnd: 80, startTime: 30 } as unknown as PerformanceEntry,
    ]);

    window.Meticulous = {
      replay: {
        isBenchmarkableReplay: false,
      },
    };

    capturePerformance();

    expect(perfSpy).toHaveBeenCalledWith("navigation");
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 50 });
  });
});
