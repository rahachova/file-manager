import { getHomePath } from "./directory.js";
import { stdin, stdout } from "node:process";
import path from "path";
import { access, readdir, lstat } from "node:fs/promises";
import { handleOSInfo } from "./os-operations.js";
import {
  handleReadAndPrint,
  handleAddNewFile,
  handleRenameFile,
  handleCopyFile,
  handleMoveFile,
  handleDeleteFile,
} from "./basic-operations.js";
import { handleFileHash } from "./hash-operations.js";
import { handleCompress, handleDecompress } from "./compress-operations.js";

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
      await handleReadAndPrint(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("add")) {
      await handleAddNewFile(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("rn")) {
      await handleRenameFile(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("cp")) {
      await handleCopyFile(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("mv")) {
      await handleMoveFile(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("rm")) {
      await handleDeleteFile(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("os")) {
      handleOSInfo(command, this.handleInvalidInput.bind(this));
    } else if (command.startsWith("hash")) {
      await handleFileHash(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("compress")) {
      await handleCompress(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
    } else if (command.startsWith("decompress")) {
      await handleDecompress(
        command,
        this.currentPath,
        this.handleInvalidInput.bind(this),
        this.handleOperationFail.bind(this)
      );
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
