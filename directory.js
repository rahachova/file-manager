import { homedir } from "os";

export function getHomePath() {
  return homedir();
}
