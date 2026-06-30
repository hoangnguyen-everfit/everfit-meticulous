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
