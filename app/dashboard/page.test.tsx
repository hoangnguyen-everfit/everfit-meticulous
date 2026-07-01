import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
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

afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 0));
  delete (window as Window).Meticulous;
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

  it("does not redirect during a Meticulous replay even without a stored token", async () => {
    window.Meticulous = { isRunningAsTest: true };
    render(<DashboardPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/items")
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
