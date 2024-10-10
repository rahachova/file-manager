import { homedir } from "os";

function getPath() {
  return homedir();
}
export default getPath;
