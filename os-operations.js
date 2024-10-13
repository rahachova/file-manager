import { stdout } from "node:process";
import { EOL, cpus, homedir, userInfo, arch } from "os";

export function handleOSInfo(command, onInvalidInput) {
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
    onInvalidInput();
  }
}
