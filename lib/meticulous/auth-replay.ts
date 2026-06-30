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
