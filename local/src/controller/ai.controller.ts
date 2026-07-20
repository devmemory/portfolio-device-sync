import axios, { AxiosInstance } from "axios";

class AIController {
  private instance!: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: "http://localhost:11434",
      timeout: 30000,
    });
  }

  async askAI(prompt: string, callback: (value: string) => void) {
    const { data } =
      await this.instance.post<ReadableStream<Uint8Array> | null>(
        "/api/generate",
        {
          model: "gemma2:2b",
          prompt,
          stream: true,
        },
        {
          responseType: "stream",
        },
      );

    if (!data) {
      return;
    }

    const decoder = new TextDecoder();

    let networkBuffer = "";
    let outputBuffer = "";
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushIntervalMs = 80;
    const maxBufferLength = 400;

    const flush = () => {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      if (!outputBuffer) {
        return;
      }

      const value = outputBuffer;
      outputBuffer = "";

      callback(value);
    };

    const scheduleFlush = () => {
      if (outputBuffer.length >= maxBufferLength) {
        flush();
        return;
      }

      if (!flushTimer) {
        flushTimer = setTimeout(flush, flushIntervalMs);
      }
    };

    const processLine = (line: string) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return;
      }

      try {
        const parsed = JSON.parse(trimmedLine);

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        if (parsed.response) {
          outputBuffer += parsed.response;
          scheduleFlush();
        }

        if (parsed.done) {
          flush();
        }
      } catch (error) {
        console.warn("[Ollama] Failed to parse response:", error);
      }
    };

    try {
      for await (const chunk of data) {
        networkBuffer += decoder.decode(chunk, { stream: true });

        const lines = networkBuffer.split("\n");

        // Preserve the final partial JSON line.
        networkBuffer = lines.pop() ?? "";

        for (const line of lines) {
          processLine(line);
        }
      }

      networkBuffer += decoder.decode();

      if (networkBuffer.trim()) {
        processLine(networkBuffer);
      }
    } finally {
      flush();
    }
  }
}

export default new AIController();
