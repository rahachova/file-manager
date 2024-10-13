import { stdout } from "node:process";
import path from "path";
import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  readdir,
  lstat,
  writeFile,
  rename,
  rm,
} from "node:fs/promises";

export async function handleReadAndPrint(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];
  if (pathCommand) {
    const pathToRead = path.resolve(currentPath, pathCommand);
    const stream = createReadStream(pathToRead, {
      encoding: "utf-8",
    });
    stream.on("data", (chunk) => {
      stdout.write(chunk + "\n");
    });
    stream.on("error", () => {
      onOperationFail();
    });
  } else {
    onInvalidInput();
  }
}

export async function handleAddNewFile(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];

  if (pathCommand) {
    const pathToAdd = path.resolve(currentPath, pathCommand);
    try {
      await writeFile(pathToAdd, "", { flag: "ax" });
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}

export async function handleRenameFile(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const nameCommand = command.split(" ")[1];
  const newNameCommand = command.split(" ")[2];

  if (nameCommand && newNameCommand) {
    const nameCommandPath = path.resolve(currentPath, nameCommand);
    const newNameCommandPath = path.resolve(currentPath, newNameCommand);
    try {
      await rename(nameCommandPath, newNameCommandPath);
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}

export async function handleCopyFile(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];
  const newPathCommand = command.split(" ")[2];
  const fileName = path.basename(pathCommand);

  if (pathCommand && newPathCommand) {
    try {
      await new Promise((resolve, reject) => {
        const pathCommandPath = path.resolve(currentPath, pathCommand);
        const newPathCommandPath = path.resolve(
          currentPath,
          newPathCommand,
          fileName
        );
        const readStream = createReadStream(pathCommandPath);
        readStream.on("error", reject);
        const writeStream = createWriteStream(newPathCommandPath);
        writeStream.on("error", reject);
        readStream.pipe(writeStream);
        writeStream.on("finish", resolve);
      });
    } catch (_) {
      console.log(_);
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}

export async function handleMoveFile(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];
  const newPathCommand = command.split(" ")[2];
  const fileName = path.basename(pathCommand);

  if (pathCommand && newPathCommand) {
    try {
      await new Promise((resolve, reject) => {
        const pathCommandPath = path.resolve(currentPath, pathCommand);
        const newPathCommandPath = path.resolve(
          currentPath,
          newPathCommand,
          fileName
        );
        const readStream = createReadStream(pathCommandPath);
        readStream.on("error", () => {
          reject();
        });
        const writeStream = createWriteStream(newPathCommandPath);
        writeStream.on("error", () => {
          reject();
        });
        writeStream.on("finish", async () => {
          await rm(pathCommandPath);
          resolve();
        });
        readStream.pipe(writeStream);
      });
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}

export async function handleDeleteFile(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];

  if (pathCommand) {
    try {
      const pathCommandPath = path.resolve(currentPath, pathCommand);
      await rm(pathCommandPath);
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}
