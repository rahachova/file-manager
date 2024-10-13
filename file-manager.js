import { getHomePath } from "./directory.js";
import { stdin, stdout } from "node:process";
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
import { EOL, cpus, homedir, userInfo, arch } from "os";
import { createHash } from "node:crypto";
import { createBrotliCompress, createBrotliDecompress } from "node:zlib";

class FileManager {
  constructor(userName = "Guest") {
    this.userName = userName;
    this.currentPath = getHomePath();

    this.init();
  }

  handleGoUp() {
    this.currentPath = path.dirname(this.currentPath);
  }

  async handleChangeDirectory(command) {
    const prevPath = this.currentPath;
    const pathCommand = command.split(" ")[1];

    try {
      if (path.isAbsolute(pathCommand)) {
        this.currentPath = path.resolve(pathCommand);
      } else {
        this.currentPath = path.resolve(this.currentPath, pathCommand);
      }
      await access(this.currentPath);
    } catch (error) {
      this.currentPath = prevPath;
      this.handleInvalidInput();
    }
  }

  async handleReadDirectory() {
    const directory = await readdir(this.currentPath);
    const files = [];
    const folders = [];
    for (const item of directory) {
      const fullPath = path.join(this.currentPath, item);
      const stats = await lstat(fullPath);
      if (stats.isDirectory()) {
        folders.push({ Name: item, Type: "directory" });
      } else {
        files.push({ Name: item, Type: "file" });
      }
    }
    console.table([...folders.sort(), ...files.sort()]);
  }

  async handleReadAndPrint(command) {
    const pathCommand = command.split(" ")[1];
    if (pathCommand) {
      const pathToRead = path.resolve(this.currentPath, pathCommand);
      const stream = createReadStream(pathToRead, {
        encoding: "utf-8",
      });
      stream.on("data", (chunk) => {
        stdout.write(chunk + "\n");
      });
      stream.on("error", () => {
        this.handleOperationFail();
      });
    } else {
      this.handleInvalidInput();
    }
  }

  async handleAddNewFile(command) {
    const pathCommand = command.split(" ")[1];

    if (pathCommand) {
      const pathToAdd = path.resolve(this.currentPath, pathCommand);
      try {
        await writeFile(pathToAdd, "", { flag: "ax" });
      } catch (_) {
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  async handleRenameFile(command) {
    const nameCommand = command.split(" ")[1];
    const newNameCommand = command.split(" ")[2];

    if (nameCommand && newNameCommand) {
      const nameCommandPath = path.resolve(this.currentPath, nameCommand);
      const newNameCommandPath = path.resolve(this.currentPath, newNameCommand);
      try {
        await rename(nameCommandPath, newNameCommandPath);
      } catch (_) {
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  async handleCopyFile(command) {
    const pathCommand = command.split(" ")[1];
    const newPathCommand = command.split(" ")[2];

    if (pathCommand && newPathCommand) {
      const pathCommandPath = path.resolve(this.currentPath, pathCommand);
      const newPathCommandPath = path.resolve(this.currentPath, newPathCommand);
      const readStream = createReadStream(pathCommandPath);
      readStream.on("error", () => {
        this.handleOperationFail();
      });
      const writeStream = createWriteStream(newPathCommandPath);
      writeStream.on("error", () => {
        this.handleOperationFail();
      });
      readStream.pipe(writeStream);
    } else {
      this.handleInvalidInput();
    }
  }

  async handleMoveFile(command) {
    const pathCommand = command.split(" ")[1];
    const newPathCommand = command.split(" ")[2];
    const fileName = path.basename(pathCommand);

    if (pathCommand && newPathCommand) {
      try {
        await new Promise((resolve, reject) => {
          const pathCommandPath = path.resolve(this.currentPath, pathCommand);
          const newPathCommandPath = path.resolve(
            this.currentPath,
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
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  async handleDeleteFile(command) {
    const pathCommand = command.split(" ")[1];

    if (pathCommand) {
      try {
        const pathCommandPath = path.resolve(this.currentPath, pathCommand);
        await rm(pathCommandPath);
      } catch (_) {
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  handleOSInfo(command) {
    const commandArgs = command.split(" ");
    if (commandArgs.find((arg) => arg === "--EOL")) {
      stdout.write(`End of Line character is: ${EOL}\n`);
    } else if (commandArgs.find((arg) => arg === "--cpus")) {
      cpus().forEach((cpu, index) => {
        const clockRateGHz = (cpu.speed / 1000).toFixed(2);
        stdout.write(`CPU ${index + 1}:\n`);
        stdout.write(`  Model: ${cpu.model}\n`);
        stdout.write(`  Clock rate: ${clockRateGHz} GHz\n`);
      });
    } else if (commandArgs.find((arg) => arg === "--homedir")) {
      stdout.write(`Home Directory: ${homedir()}\n`);
    } else if (commandArgs.find((arg) => arg === "--username")) {
      stdout.write(`Current System Username: ${userInfo().username}\n`);
    } else if (commandArgs.find((arg) => arg === "--architecture")) {
      stdout.write(`CPU Architecture: ${arch}\n`);
    } else {
      this.handleInvalidInput();
    }
  }

  async handleFileHash(command) {
    const pathCommand = command.split(" ")[1];

    if (pathCommand) {
      try {
        const hash = await new Promise((resolve, reject) => {
          const pathCommandPath = path.resolve(this.currentPath, pathCommand);
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
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  async handleCompress(command) {
    const pathCommand = command.split(" ")[1];
    const newPathCommand = command.split(" ")[2];

    if (pathCommand && newPathCommand) {
      try {
        const pathCommandPath = path.resolve(this.currentPath, pathCommand);
        const newPathCommandPath = path.resolve(
          this.currentPath,
          newPathCommand
        );
        const readableStream = createReadStream(pathCommandPath);
        readableStream.on("error", () => {
          this.handleOperationFail();
        });
        const writebleStream = createWriteStream(newPathCommandPath);
        writebleStream.on("error", () => {
          this.handleOperationFail();
        });
        const brotli = createBrotliCompress();

        readableStream.pipe(brotli).pipe(writebleStream);
      } catch (_) {
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }
  async handleDecompress(command) {
    const pathCommand = command.split(" ")[1];
    const newPathCommand = command.split(" ")[2];

    if (pathCommand && newPathCommand) {
      try {
        const pathCommandPath = path.resolve(this.currentPath, pathCommand);
        const newPathCommandPath = path.resolve(
          this.currentPath,
          newPathCommand
        );

        const readableStream = createReadStream(pathCommandPath);
        readableStream.on("error", () => {
          this.handleOperationFail();
        });
        const writebleStream = createWriteStream(newPathCommandPath);
        writebleStream.on("error", () => {
          this.handleOperationFail();
        });

        const brotli = createBrotliDecompress();

        readableStream.pipe(brotli).pipe(writebleStream);
      } catch (_) {
        this.handleOperationFail();
      }
    } else {
      this.handleInvalidInput();
    }
  }

  displayGreeting() {
    stdout.write(`Welcome to the File Manager, ${this.userName}!\n`);
  }

  displayCurrentPath() {
    stdout.write(`You are currently in ${this.currentPath}\n`);
  }

  startListenUserInput() {
    stdout.write("Print your command...\n");
    stdin.on("data", this.handleUserInput.bind(this));
  }

  async handleUserInput(data) {
    const command = data.toString().trim();
    if (command.startsWith(".exit")) {
      this.handleExit();
    } else if (command.startsWith("up")) {
      this.handleGoUp();
    } else if (command.startsWith("cd")) {
      await this.handleChangeDirectory(command);
    } else if (command === "ls") {
      await this.handleReadDirectory(command);
    } else if (command.startsWith("cat")) {
      await this.handleReadAndPrint(command);
    } else if (command.startsWith("add")) {
      await this.handleAddNewFile(command);
    } else if (command.startsWith("rn")) {
      await this.handleRenameFile(command);
    } else if (command.startsWith("cp")) {
      await this.handleCopyFile(command);
    } else if (command.startsWith("mv")) {
      await this.handleMoveFile(command);
    } else if (command.startsWith("rm")) {
      await this.handleDeleteFile(command);
    } else if (command.startsWith("os")) {
      this.handleOSInfo(command);
    } else if (command.startsWith("hash")) {
      await this.handleFileHash(command);
    } else if (command.startsWith("compress")) {
      await this.handleCompress(command);
    } else if (command.startsWith("decompress")) {
      await this.handleDecompress(command);
    } else {
      this.handleInvalidInput();
    }

    this.displayCurrentPath();
  }

  startListenSigint() {
    process.on("SIGINT", this.handleExit.bind(this));
  }

  handleInvalidInput() {
    stdout.write("Invalid input\n");
  }

  handleOperationFail() {
    stdout.write("Operation failed\n");
  }

  handleExit() {
    stdout.write(
      `Thank you for using File Manager, ${this.userName}, goodbye!\n`
    );
    process.exit();
  }

  init() {
    this.displayGreeting();
    this.displayCurrentPath();
    this.startListenUserInput();
    this.startListenSigint();
  }
}

export default FileManager;
