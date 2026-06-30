# Meticulous Full Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up every developer-side Meticulous integration point in the demo Next.js app (replay detection, full-auth injection, performance capture, deterministic replay behavior, network-mock demo, CI/PR), using a centralized `lib/meticulous/` module.

**Architecture:** Approach A — all Meticulous logic lives in `lib/meticulous/` with a thin `lib/auth.ts` token gate and a `MeticulousBootstrap` client component mounted in the layout. Pages call typed helpers; nothing Meticulous-specific is scattered across components, so porting to `everfit-react` is a directory copy plus a few call sites.

**Tech Stack:** Next.js 14 (App Router), TypeScript, pnpm, Vitest + React Testing Library + jsdom, Docker, GitHub Actions.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `vitest.config.ts`, `vitest.setup.ts` | Test runner config |
| `types/global.d.ts` | `window.Meticulous` + `window.__perfMetrics` typings |
| `lib/meticulous/replay.ts` | `isReplay()`, `isMeticulousBuild()`, `nextDeterministicId()` |
| `lib/auth.ts` | `login` / `logout` / `getToken` / `isAuthenticated` |
| `lib/meticulous/auth-replay.ts` | `injectAuthForReplay()` |
| `lib/meticulous/performance.ts` | `capturePerformance()` |
| `lib/meticulous/index.ts` | Public re-exports |
| `app/api/items/route.ts` | Add `POST` (mock write — demonstrates #3) |
| `components/MeticulousBootstrap.tsx` | Mount-time `injectAuthForReplay()` + `capturePerformance()` |
| `app/layout.tsx` | Mount `<MeticulousBootstrap/>` |
| `app/login/page.tsx` | Store token + redirect to `/dashboard` |
| `app/dashboard/page.tsx` | Auth guard + deterministic id + POST on add |
| `README.md` | Document testing pool (#10), mocking (#3), perf (#8), auth |

---

## Task 1: Test infrastructure (Vitest + RTL)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm add -D vitest@^2.1.8 jsdom@^25.0.1 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @vitejs/plugin-react@^4.3.4
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` block, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 5: Add a smoke test to confirm the runner works**

Create `lib/__smoke__.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `pnpm test`
Expected: PASS (1 test passed)

- [ ] **Step 7: Delete the smoke test and commit**

```bash
rm lib/__smoke__.test.ts
git add package.json pnpm-lock.yaml vitest.config.ts vitest.setup.ts
git commit -m "chore: add vitest + react testing library"
```

---

## Task 2: Global types for `window.Meticulous`

**Files:**
- Create: `types/global.d.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create `types/global.d.ts`**

```ts
export {};

interface MeticulousReplayNative {
  performance: Performance;
}

interface MeticulousApi {
  isRunningAsTest?: boolean;
  replay?: { native?: MeticulousReplayNative };
}

declare global {
  interface Window {
    Meticulous?: MeticulousApi;
    __perfMetrics?: Array<{ name: string; value: number }>;
  }
}
```

- [ ] **Step 2: Ensure `tsconfig.json` includes the types**

Confirm the `"include"` array contains `"**/*.ts"` (it already does). No change needed if present. If `types/` is excluded anywhere, remove that exclusion.

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

```bash
git add types/global.d.ts tsconfig.json
git commit -m "feat: add window.Meticulous global types"
```

---

## Task 3: `lib/meticulous/replay.ts`

**Files:**
- Create: `lib/meticulous/replay.ts`
- Test: `lib/meticulous/replay.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/meticulous/replay.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/meticulous/replay.test.ts`
Expected: FAIL (cannot find module `./replay`)

- [ ] **Step 3: Write minimal implementation**

`lib/meticulous/replay.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/meticulous/replay.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/meticulous/replay.ts lib/meticulous/replay.test.ts
git commit -m "feat: add meticulous replay detection helpers"
```

---

## Task 4: `lib/auth.ts` (token gate)

**Files:**
- Create: `lib/auth.ts`
- Test: `lib/auth.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { login, logout, getToken, isAuthenticated } from "./auth";

beforeEach(() => {
  localStorage.clear();
});

describe("auth token gate", () => {
  it("starts unauthenticated", () => {
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
  });

  it("login stores a token", () => {
    login("a@b.com");
    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toContain("a@b.com");
  });

  it("logout clears the token", () => {
    login("a@b.com");
    logout();
    expect(isAuthenticated()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/auth.test.ts`
Expected: FAIL (cannot find module `./auth`)

- [ ] **Step 3: Write minimal implementation**

`lib/auth.ts`:

```ts
export const AUTH_TOKEN_KEY = "demo_auth_token";

export function login(email: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, `token-for-${email}`);
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add localStorage token-gate auth"
```

---

## Task 5: `lib/meticulous/auth-replay.ts`

**Files:**
- Create: `lib/meticulous/auth-replay.ts`
- Test: `lib/meticulous/auth-replay.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/meticulous/auth-replay.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { injectAuthForReplay } from "./auth-replay";
import { isAuthenticated } from "../auth";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  delete (window as Window).Meticulous;
});

describe("injectAuthForReplay", () => {
  it("does nothing when not replaying", () => {
    injectAuthForReplay();
    expect(isAuthenticated()).toBe(false);
  });

  it("injects a token when replaying and unauthenticated", () => {
    window.Meticulous = { isRunningAsTest: true };
    injectAuthForReplay();
    expect(isAuthenticated()).toBe(true);
  });

  it("does not overwrite an existing token", () => {
    window.Meticulous = { isRunningAsTest: true };
    localStorage.setItem("demo_auth_token", "token-for-real@user.com");
    injectAuthForReplay();
    expect(localStorage.getItem("demo_auth_token")).toBe("token-for-real@user.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/meticulous/auth-replay.test.ts`
Expected: FAIL (cannot find module `./auth-replay`)

- [ ] **Step 3: Write minimal implementation**

`lib/meticulous/auth-replay.ts`:

```ts
import { isReplay } from "./replay";
import { isAuthenticated, login } from "../auth";

const REPLAY_USER_EMAIL = "replay@meticulous.test";

// During a Meticulous replay, inject a deterministic token so protected pages
// render even though the recorded session's auth differs/expired. (#7 full auth)
export function injectAuthForReplay(): void {
  if (!isReplay()) return;
  if (isAuthenticated()) return;
  login(REPLAY_USER_EMAIL);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/meticulous/auth-replay.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/meticulous/auth-replay.ts lib/meticulous/auth-replay.test.ts
git commit -m "feat: inject auth token during meticulous replay"
```

---

## Task 6: `lib/meticulous/performance.ts`

**Files:**
- Create: `lib/meticulous/performance.ts`
- Test: `lib/meticulous/performance.test.ts`

- [ ] **Step 1: Verify the `window.Meticulous` performance API shape against docs**

Before coding, fetch the official reference and confirm the access path used below
(`window.Meticulous.replay.native.performance`). Do NOT code from memory.
Doc: https://app.meticulous.ai/docs/how-to/window-meticulous-object
If the shape differs, adjust the implementation in Step 3 and the test in Step 1 to match.

- [ ] **Step 2: Write the failing test**

`lib/meticulous/performance.test.ts`:

```ts
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

  it("prefers the Meticulous native performance object during replay", () => {
    const nativeGet = vi.fn().mockReturnValue([
      { domContentLoadedEventEnd: 50, startTime: 10 } as unknown as PerformanceEntry,
    ]);
    window.Meticulous = {
      isRunningAsTest: true,
      replay: { native: { performance: { getEntriesByType: nativeGet } as unknown as Performance } },
    };
    capturePerformance();
    expect(nativeGet).toHaveBeenCalledWith("navigation");
    expect(window.__perfMetrics?.[0]).toEqual({ name: "domContentLoaded", value: 40 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run lib/meticulous/performance.test.ts`
Expected: FAIL (cannot find module `./performance`)

- [ ] **Step 4: Write minimal implementation**

`lib/meticulous/performance.ts`:

```ts
// Capture real frontend performance. During replay, window.Meticulous.replay.native
// bypasses Meticulous' stubbing and returns real values. (#8)
export function capturePerformance(): void {
  if (typeof window === "undefined") return;

  const perf = window.Meticulous?.replay?.native?.performance ?? window.performance;
  const nav = perf.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  const metric = {
    name: "domContentLoaded",
    value: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
  };

  window.__perfMetrics = window.__perfMetrics ?? [];
  window.__perfMetrics.push(metric);
  console.log("[meticulous][perf]", metric);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run lib/meticulous/performance.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/meticulous/performance.ts lib/meticulous/performance.test.ts
git commit -m "feat: capture real frontend performance via meticulous native API"
```

---

## Task 7: `lib/meticulous/index.ts` (public surface)

**Files:**
- Create: `lib/meticulous/index.ts`

- [ ] **Step 1: Create the barrel file**

```ts
export { isReplay, isMeticulousBuild, nextDeterministicId } from "./replay";
export { injectAuthForReplay } from "./auth-replay";
export { capturePerformance } from "./performance";
```

- [ ] **Step 2: Type-check and commit**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

```bash
git add lib/meticulous/index.ts
git commit -m "feat: add meticulous module barrel export"
```

---

## Task 8: `POST /api/items` (network-mock demo, #3)

**Files:**
- Modify: `app/api/items/route.ts`

- [ ] **Step 1: Add the POST handler**

Append to `app/api/items/route.ts` (keep the existing `GET`):

```ts
// Mock write endpoint. In production this would persist; on replay Meticulous
// returns the recorded response, so there is no real side-effect. (#3)
export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  return NextResponse.json(
    { item: { id: 0, name: body.name ?? "" } },
    { status: 201 }
  );
}
```

- [ ] **Step 2: Verify the endpoint responds**

Run:
```bash
curl -s -X POST http://localhost:4000/api/items -H "Content-Type: application/json" -d '{"name":"X"}' -w "\n[%{http_code}]\n"
```
Expected: `{"item":{"id":0,"name":"X"}}` and `[201]`
(Start the dev server first if needed: `pnpm dev --port 4000`.)

- [ ] **Step 3: Commit**

```bash
git add app/api/items/route.ts
git commit -m "feat: add mock POST /api/items to demonstrate network mocking"
```

---

## Task 9: `MeticulousBootstrap` component + mount in layout

**Files:**
- Create: `components/MeticulousBootstrap.tsx`
- Test: `components/MeticulousBootstrap.test.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

`components/MeticulousBootstrap.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/MeticulousBootstrap.test.tsx`
Expected: FAIL (cannot find module `./MeticulousBootstrap`)

- [ ] **Step 3: Write minimal implementation**

`components/MeticulousBootstrap.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { injectAuthForReplay, capturePerformance } from "@/lib/meticulous";

// Runs Meticulous-specific bootstrapping once on mount.
export default function MeticulousBootstrap() {
  useEffect(() => {
    injectAuthForReplay();
    capturePerformance();
  }, []);
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run components/MeticulousBootstrap.test.tsx`
Expected: PASS

- [ ] **Step 5: Mount it in `app/layout.tsx`**

Add the import near the top:

```tsx
import MeticulousBootstrap from "@/components/MeticulousBootstrap";
```

Inside `<body>`, immediately before `<nav ...>`, add:

```tsx
        <MeticulousBootstrap />
```

- [ ] **Step 6: Type-check and commit**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

```bash
git add components/MeticulousBootstrap.tsx components/MeticulousBootstrap.test.tsx app/layout.tsx
git commit -m "feat: mount MeticulousBootstrap in layout"
```

---

## Task 10: Login stores token + redirects (#7)

**Files:**
- Modify: `app/login/page.tsx`
- Test: `app/login/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/login/page.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "./page";
import { isAuthenticated } from "@/lib/auth";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  localStorage.clear();
});

describe("LoginPage", () => {
  it("stores a token and redirects to /dashboard on submit", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByTestId("input-email-login"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByTestId("input-password-login"), {
      target: { value: "pw" },
    });
    fireEvent.submit(screen.getByTestId("form-login"));
    expect(isAuthenticated()).toBe(true);
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/login/page.test.tsx`
Expected: FAIL (current page uses `submitted` state, no token/redirect)

- [ ] **Step 3: Rewrite `app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    router.push("/dashboard");
  };

  return (
    <section>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        data-testid="form-login"
        style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}
      >
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-email-login"
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password-login"
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          data-testid="btn-submit-login"
          style={{ padding: 10, background: "#5158cf", color: "#fff", border: 0, borderRadius: 6 }}
        >
          Log in
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/login/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/login/page.tsx app/login/page.test.tsx
git commit -m "feat: login stores token and redirects to dashboard"
```

---

## Task 11: Dashboard guard + deterministic id + POST (#9, #3)

**Files:**
- Modify: `app/dashboard/page.tsx`
- Test: `app/dashboard/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/dashboard/page.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import DashboardPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ items: [] }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardPage", () => {
  it("redirects to /login when not authenticated", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("loads items when authenticated", async () => {
    localStorage.setItem("demo_auth_token", "token-for-a@b.com");
    render(<DashboardPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/items")
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/dashboard/page.test.tsx`
Expected: FAIL (current page has no auth guard)

- [ ] **Step 3: Rewrite `app/dashboard/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { isReplay, nextDeterministicId } from "@/lib/meticulous";

type Item = { id: number; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const loadItems = async () => {
      setIsLoading(true);
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.items);
      setIsLoading(false);
    };
    loadItems();
  }, [router]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    // Deterministic id during replay avoids flaky visual diffs from Date.now(). (#9)
    const id = isReplay() ? nextDeterministicId() : Date.now();
    // Fire a write request; Meticulous mocks this on replay (no real side-effect). (#3)
    void fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setItems((prev) => [...prev, { id, name: newName.trim() }]);
    setNewName("");
  };

  const handleRemove = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section>
      <h1>Dashboard</h1>

      <form onSubmit={handleAdd} data-testid="form-add-item" style={{ display: "flex", gap: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New item name"
          data-testid="input-name-item"
          style={{ flex: 1, padding: 8 }}
        />
        <button
          type="submit"
          data-testid="btn-add-item"
          style={{ padding: "8px 16px", background: "#5158cf", color: "#fff", border: 0, borderRadius: 6 }}
        >
          Add
        </button>
      </form>

      {isLoading ? (
        <p data-testid="text-items-loading">Loading...</p>
      ) : (
        <ul data-testid="list-items">
          {items.map((item) => (
            <li key={item.id} data-testid={`row-item-${item.id}`} style={{ marginBottom: 6 }}>
              {item.name}{" "}
              <button
                onClick={() => handleRemove(item.id)}
                data-testid={`btn-remove-item-${item.id}`}
                style={{ marginLeft: 8, color: "#dc2626", border: 0, background: "none", cursor: "pointer" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/dashboard/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/page.test.tsx
git commit -m "feat: protect dashboard, deterministic ids, mock POST on add"
```

---

## Task 12: Browser smoke verification (Claude Preview)

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev --port 4000` (or reuse the running Preview server).

- [ ] **Step 2: Verify the full flow in a real browser**

Drive the app (via Claude Preview or manually) and confirm:
- Visiting `/dashboard` while logged out redirects to `/login`.
- Submitting login stores a token and lands on `/dashboard` with items loaded.
- Adding an item issues a `POST /api/items` (visible in the network panel) and appends the row.
- Removing an item drops the row.

Expected: all four behaviors hold, no console errors.

- [ ] **Step 3: Record a Meticulous session**

With the recorder active (`.env.local` token present), perform the flow above so a
session is captured for later CI runs. Confirm it appears in the Meticulous UI.

---

## Task 13: CI/PR setup — Docker (#6) — REQUIRES USER ACTIONS

**Files:** none new (reuses existing `Dockerfile`, `.github/workflows/meticulous.yaml`)

> Steps marked 🔴 require the user (GitHub permissions / Meticulous UI).

- [ ] **Step 1: Initialize git and push to the personal repo** 🔴

```bash
git init
git add -A
git commit -m "chore: initial meticulous demo"
git branch -M main
git remote add origin https://github.com/hoangnguyen-everfit/everfit-meticulous.git
git push -u origin main
```

- [ ] **Step 2: Install the Meticulous GitHub App on the repo** 🔴

Visit https://github.com/apps/alwaysmeticulous and grant access to
`hoangnguyen-everfit/everfit-meticulous`.

- [ ] **Step 3: Add the API token secret** 🔴

In the repo: Settings → Secrets and variables → Actions → New repository secret:
- Name: `METICULOUS_API_TOKEN`
- Value: the API token from the Meticulous project.

- [ ] **Step 4: Verify the Docker build locally (optional but recommended)**

Run (with Docker Desktop running):
```bash
docker build -t meticulous-demo:verify . && \
docker run --rm -p 3000:3000 -e PORT=3000 meticulous-demo:verify
```
Expected: container serves http://localhost:3000 with HTTP 200. Stop it after checking.

- [ ] **Step 5: Confirm the workflow runs on `main` to create a baseline**

After the push in Step 1, check the repo's Actions tab. The `Meticulous` workflow should
run on `main`. Expected: green run (it establishes the baseline). No PR diff appears yet —
this is expected.

- [ ] **Step 6: Open a test PR** 🔴

Create a branch, make a small visible UI change, push, and open a PR:
```bash
git checkout -b test/meticulous-diff
# (make a small UI tweak, e.g., change the home heading)
git commit -am "test: trigger meticulous diff"
git push -u origin test/meticulous-diff
```
Then open the PR on GitHub.

- [ ] **Step 7: Review the test run**

In the Meticulous UI → "Test runs" tab, confirm the PR produced a test run with visual
diffs. (PR comments are off by default for new projects.)

---

## Task 14: Documentation (#10, #3, #8 in README)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append a "Meticulous integration" section to `README.md`**

Add the following section at the end of the file:

```markdown
## Meticulous integration (developer-side)

All Meticulous logic lives in `lib/meticulous/`:

- `isReplay()` / `isMeticulousBuild()` — detect replay/test-build context.
- `injectAuthForReplay()` — (#7) injects a deterministic token during replay so
  protected pages render. Mounted via `components/MeticulousBootstrap.tsx`.
- `capturePerformance()` — (#8) reads real metrics via
  `window.Meticulous.replay.native` and pushes to `window.__perfMetrics`
  (inspect in DevTools console).
- `nextDeterministicId()` — (#9) used by the dashboard so added-item ids are stable
  during replay instead of `Date.now()`.

### Network mocking (#3)

`GET /api/items` and `POST /api/items` are mocked automatically by Meticulous on replay —
the recorded responses are replayed, so there are no real side-effects and no flaky diffs.

### Testing pool — selecting which sessions run (#10)

Configure which recorded sessions run in CI in the Meticulous UI (project settings →
session selection / testing pool). Meticulous auto-selects sessions covering distinct
user types, data variants, and feature-flag combinations; you can refine the pool there.
Docs: https://app.meticulous.ai/docs/how-to/testing-pool

### Unit tests

Run `pnpm test` (Vitest + React Testing Library). Meticulous itself provides the
visual end-to-end layer.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document meticulous integration, mocking, testing pool"
```

---

## Self-Review Notes

- **Spec coverage:** #3 → Task 8/11; #6 → Task 13; #7 → Task 5/9/10; #8 → Task 6/9;
  #9 → Task 3/11; #10 → Task 14; recording → Task 12; test infra → Task 1. All covered.
- **Type consistency:** `isReplay`, `isMeticulousBuild`, `nextDeterministicId`,
  `injectAuthForReplay`, `capturePerformance`, `login/logout/getToken/isAuthenticated`,
  `AUTH_TOKEN_KEY = "demo_auth_token"` used consistently across tasks.
- **Verify-before-code:** Task 6 Step 1 forces confirming the `window.Meticulous`
  performance API shape against the official doc before implementing.
```
