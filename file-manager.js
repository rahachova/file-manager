import getPath from "./directory.js";
import { stdin, stdout } from "node:process";

class FileManager {
  constructor(userName = "Guest") {
    this.userName = userName;
    this.currentPath = getPath();

    this.init();
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

  handleUserInput(data) {
    if (data.toString().startsWith(".exit")) {
      this.handleExit();
    }
    this.displayCurrentPath();
  }

  startListenSigint() {
    process.on("SIGINT", this.handleExit.bind(this));
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
