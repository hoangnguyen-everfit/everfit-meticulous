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
