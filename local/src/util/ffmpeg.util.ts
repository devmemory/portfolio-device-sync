import { execSync } from "child_process";
import { cpus } from "os";

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
      pixelFormat: "mjpeg",
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

      // 1. Try to find the very first dedicated physical video device block
      const standardMatch = output.match(
        /\[\[\d+\]\]\s+Video\s+devices:\s*\n\[avfoundation\s+@\s+\w+\]\s+\[(\d+)\]/,
      );
      if (standardMatch) {
        deviceIndex = standardMatch[1];
      } else {
        // 2. Strict Fallback: Look specifically for hardware cameras first, ignore screens
        const cameraMatch = output.match(
          /\[(\d+)\]\s+.*?(Camera|Webcam|FaceTime)/i,
        );
        if (cameraMatch) {
          deviceIndex = cameraMatch[1];
        } else {
          // 3. Absolute Last Resort: Just grab the first video input available if no camera keyword exists
          const anyVideoMatch = output.match(/\[(\d+)\]\s+.*?/);
          if (anyVideoMatch) deviceIndex = anyVideoMatch[1];
        }
      }
    } catch (error: any) {
      const output = error.output ? error.output.join("") : "";

      // Mirror the clean parsing priority in the catch block
      const cameraMatch = output.match(
        /\[(\d+)\]\s+.*?(Camera|Webcam|FaceTime)/i,
      );
      if (cameraMatch) {
        deviceIndex = cameraMatch[1];
      } else {
        const anyVideoMatch = output.match(/\[(\d+)\]\s+.*?/);
        if (anyVideoMatch) deviceIndex = anyVideoMatch[1];
      }
    }

    return {
      formatDriver: "avfoundation",
      formatParam: "-pixel_format",
      pixelFormat: "nv12",
      device: deviceIndex,
    };
  }

  // 3. LINUX & RASPBERRY PI (V4L2)
  return {
    formatDriver: "v4l2",
    formatParam: "-input_format",
    pixelFormat: "mjpeg",
    device: "/dev/video0",
  };
};

export const getThreads = () => {
  const totalCpus = cpus().length;
  let targetThreads;

  if (totalCpus <= 4) {
    targetThreads = Math.max(1, totalCpus - 1);
  } else if (totalCpus <= 6) {
    targetThreads = 3;
  } else {
    targetThreads = 4;
  }

  return targetThreads.toString()
};
