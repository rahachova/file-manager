import path from "path";
import { createReadStream, createWriteStream } from "node:fs";
import { createBrotliCompress, createBrotliDecompress } from "node:zlib";

export async function handleCompress(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];
  const newPathCommand = command.split(" ")[2];

  if (pathCommand && newPathCommand) {
    try {
      const pathCommandPath = path.resolve(currentPath, pathCommand);
      const newPathCommandPath = path.resolve(currentPath, newPathCommand);
      const readableStream = createReadStream(pathCommandPath);
      readableStream.on("error", () => {
        onOperationFail();
      });
      const writebleStream = createWriteStream(newPathCommandPath);
      writebleStream.on("error", () => {
        onOperationFail();
      });
      const brotli = createBrotliCompress();

      readableStream.pipe(brotli).pipe(writebleStream);
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}

export async function handleDecompress(
  command,
  currentPath,
  onInvalidInput,
  onOperationFail
) {
  const pathCommand = command.split(" ")[1];
  const newPathCommand = command.split(" ")[2];

  if (pathCommand && newPathCommand) {
    try {
      const pathCommandPath = path.resolve(currentPath, pathCommand);
      const newPathCommandPath = path.resolve(currentPath, newPathCommand);

      const readableStream = createReadStream(pathCommandPath);
      readableStream.on("error", () => {
        onOperationFail();
      });
      const writebleStream = createWriteStream(newPathCommandPath);
      writebleStream.on("error", () => {
        onOperationFail();
      });

      const brotli = createBrotliDecompress();

      readableStream.pipe(brotli).pipe(writebleStream);
    } catch (_) {
      onOperationFail();
    }
  } else {
    onInvalidInput();
  }
}
