import { execSync } from "child_process";

export const getPlatformSpecs = () => {
  const platform = process.platform;

  // 1. WINDOWS (DirectShow)
  if (platform === "win32") {
    let deviceName = "video=FHD Webcam";
    try {
      const output = execSync(
        "ffmpeg -list_devices true -f dshow -i dummy 2>&1",
        { encoding: "utf8" },
      );
      const match = output.match(/"([^"]+)"\s+\(video\)/);
      if (match) deviceName = `video=${match[1]}`;
    } catch (error: any) {
      const output = error.output ? error.output.join("") : "";
      const match = output.match(/"([^"]+)"\s+\(video\)/);
      if (match) deviceName = `video=${match[1]}`;
    }

    return {
      formatDriver: "dshow",
      formatParam: "-vcodec",
      device: deviceName,
    };
  }

  // 2. MACOS (AVFoundation)
  if (platform === "darwin") {
    let deviceIndex = "0";
    try {
      const output = execSync(
        "ffmpeg -f avfoundation -list_devices true -i dummy 2>&1",
        { encoding: "utf8" },
      );
      const match = output.match(
        /\[\[\d+\]\]\s+Video\s+devices:\s*\n\[avfoundation\s+@\s+\w+\]\s+\[(\d+)\]/,
      );
      if (match) deviceIndex = match[1];
    } catch (error: any) {
      const output = error.output ? error.output.join("") : "";
      const match = output.match(/\[(\d+)\]\s+.*?(Camera|Capture|Display)/i);
      if (match) deviceIndex = match[1];
    }
    return {
      formatDriver: "avfoundation",
      formatParam: "-pixel_format",
      device: deviceIndex,
    };
  }

  // 3. LINUX & RASPBERRY PI (V4L2)
  return {
    formatDriver: "v4l2",
    formatParam: "-input_format",
    device: "/dev/video0",
  };
};
