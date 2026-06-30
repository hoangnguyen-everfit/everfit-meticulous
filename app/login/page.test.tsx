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
