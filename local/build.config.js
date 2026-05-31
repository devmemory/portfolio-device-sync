const { build } = require("esbuild");
const { config } = require("dotenv");

config();

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "build/index.js",
  minify: true,
  pure: ["console.log", "console.info"],
  define: {
    "process.env.CLOUD_BASE_URL": JSON.stringify(
      process.env.CLOUD_BASE_URL || "",
    ),
    "process.env.CLIENT_URL": JSON.stringify(process.env.CLIENT_URL || ""),
    "process.env.AMQP_URL": JSON.stringify(process.env.AMQP_URL || ""),
    "process.env.APP_AUTH": JSON.stringify(process.env.APP_AUTH || ""),
  },
}).catch(() => process.exit(1));
