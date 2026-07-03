import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

export const serviceUtil = {
  hasFfmpeg: async () => {
    try {
      await execPromise("ffmpeg -version");
      return true;
    } catch (error) {
      return false;
    }
  },
  hasAIModel: async () => {
    try {
      await execPromise("ollama --version");
      return true;
    } catch (error) {
      return false;
    }
  },
};
