import { createHash } from "node:crypto";
import { stdout } from "node:process";
import path from "path";
import { createReadStream } from "node:fs";

export async function handleFileHash(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];

  if (pathCommand) {
    try {
      const hash = await new Promise((resolve, reject) => {
        const pathCommandPath = path.resolve(currentPath, pathCommand);
        const hash = createHash("sha256");
        const readStream = createReadStream(pathCommandPath, {
          encoding: "utf-8",
        });
        readStream.on("data", (chunk) => {
          hash.update(chunk);
        });
        readStream.on("end", () => {
          resolve(hash.digest("hex"));
        });
        readStream.on("error", () => {
          reject();
        });
      });

      stdout.write(`${hash}\n`);
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}
