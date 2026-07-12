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
          model: "llama3",
          prompt: prompt,
          stream: true,
        },
        { responseType: "stream" },
      );

    if (data) {
      for await (const chunk of data) {
        const lines = Buffer.from(chunk).toString("utf-8").trim().split("\n");
        let resultText = "";

        for (const line of lines) {
          if (line) {
            try {
              const parsed = JSON.parse(line);

              if (parsed.response) {
                resultText += parsed.response;
              }
            } catch (err) {
              console.warn("[Ollama] Skipped a partial network frame.");
            }
          }
        }

        if (resultText !== "") {
          callback(resultText);
        }
      }
    }
  }
}

export default new AIController();
