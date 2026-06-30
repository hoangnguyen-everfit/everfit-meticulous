export {};

// Note: The official Meticulous API does NOT provide replay.native.performance.
// The API only includes: isRunningAsTest, recordCustomValues, getCustomValues,
// pause, resume, recordCustomEvent, and onReplayCustomEvent.
interface MeticulousApi {
  isRunningAsTest?: boolean;
  recordCustomValues?: (values: Record<string, unknown>) => void;
  getCustomValues?: () => Record<string, unknown>;
  pause?: () => void;
  resume?: () => void;
  recordCustomEvent?: (event: string, data?: unknown) => void;
  onReplayCustomEvent?: (event: string, callback: (data?: unknown) => void) => void;
}

declare global {
  interface Window {
    Meticulous?: MeticulousApi;
    __perfMetrics?: Array<{ name: string; value: number }>;
  }
}
