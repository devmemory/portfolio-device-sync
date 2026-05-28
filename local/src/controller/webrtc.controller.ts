import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as dgram from "dgram";
import { MediaStreamTrack, RTCPeerConnection } from "werift";
import { ERR_CODE } from "../constants";
import { IceCandidateModel } from "../models";
import { getPlatformSpecs } from "../util/ffmpeg.util";
import deviceController from "./device.controller";

class WebRTCController {
  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private udpServer: dgram.Socket | null = null;
  private UDP_PORT = 55555;
  private isInit = false;
  private turnInfo: any;
  public iceCandidateQueue: IceCandidateModel[] = [];
  public isConnected = false;

  init = async (data?: any) => {
    if (this.isInit) {
      return;
    }

    if (data) {
      this.turnInfo = data;
    }

    this.isInit = true;

    await this.dispose();

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        this.turnInfo],
      icePortRange: [49152, 65535],
    });

    this._onAddTrack();

    this._onIceCandidate();

    this._onStatusChange();
  };

  private _onAddTrack = () => {
    this.videoTrack = new MediaStreamTrack({
      kind: "video",
      codec: {
        mimeType: "video/VP8",
        clockRate: 90000,
        payloadType: 96,
        direction: "sendonly",
        name: "video",
        contentType: "video/VP8",
        str: "video/VP8 90000",
        rtcpFeedback: [
          { type: "nack", parameter: "" },
          { type: "nack", parameter: "pli" },
        ],
      },
    });

    this.peerConnection!.addTrack(this.videoTrack);
  };

  private _onIceCandidate = async () => {
    this.peerConnection!.onicecandidate = (e) => {
      if (!e.candidate) {
        return;
      }

      const { candidate, sdpMid, sdpMLineIndex } = e.candidate;

      console.log("[iceCandidate]", { candidate, sdpMid, sdpMLineIndex });

      if (sdpMid === undefined || sdpMLineIndex === undefined) {
        return;
      }

      this.iceCandidateQueue.push({ candidate, sdpMid, sdpMLineIndex });
    };
  };

  private _onStatusChange = () => {
    this.peerConnection!.onconnectionstatechange = async () => {
      console.log("Connection state:", this.peerConnection?.connectionState);

      switch (this.peerConnection?.connectionState) {
        case "connected":
          this.isConnected = true;
          break;
        case "closed":
        case "disconnected":
        case "failed":
          await this.dispose();
          break;
        default:
          break;
      }
    };
  };

  async receiveOffer(offer?: RTCSessionDescriptionInit) {
    if (!this.isInit) {
      await this.init();
    }

    if (!offer || !this.peerConnection) {
      console.log("[offer] peerConnection is null");
      return false;
    }

    offer.sdp = offer.sdp?.replace(
      /profile-level-id=[a-fA-F0-9]{6}/g,
      "profile-level-id=42001f",
    );

    await this.peerConnection.setRemoteDescription(offer);
    console.log("[WebRTC] set remote description");

    return true;
  }

  async sendAnswer() {
    if (!this.peerConnection) {
      console.log("[answer] peerConnection is null");
      return;
    }

    const answer = await this.peerConnection.createAnswer();

    await this.peerConnection?.setLocalDescription(answer);

    console.log({ answer });

    this.launchFfmpeg();

    return answer;
  }

  async receiveIceCandidate(candidate?: RTCIceCandidateInit) {
    if (!candidate) {
      return false;
    }

    await this.peerConnection?.addIceCandidate(candidate);

    return true;
  }

  launchFfmpeg = async () => {
    if (this.udpServer) {
      try {
        this.udpServer.close();
      } catch (e) {
        deviceController.sendErr(ERR_CODE.UDP_CLOSE, `${e}`);
      }
    }

    this.udpServer = dgram.createSocket("udp4");

    // CRITICAL FIX: Handle socket-level errors
    this.udpServer.on("error", this._onUdpError);

    this.udpServer.on("message", this._onUdpMessage);

    this.udpServer.bind(this.UDP_PORT, "127.0.0.1", () => {
      console.log(`[FFmpeg] UDP server started on port ${this.UDP_PORT}`);

      const { formatDriver, formatParam, device } = getPlatformSpecs();

      this.ffmpegProcess = spawn("ffmpeg", [
        "-loglevel",
        "error",

        "-f",
        formatDriver,
        formatParam,
        "mjpeg",
        "-video_size",
        "1280x720",
        "-framerate",
        "30",
        "-i",
        device,

        "-pix_fmt",
        "yuv420p",
        "-vcodec",
        "libvpx",
        "-deadline",
        "realtime",
        "-cpu-used",
        "5",
        "-g",
        "30",
        "-keyint_min",
        "30",
        "-f",
        "rtp",
        "-payload_type",
        "96",
        `rtp://127.0.0.1:${this.UDP_PORT}?pkt_size=1200`,
      ]);

      this.ffmpegProcess.on("error", (err) => {
        console.error("[FFmpeg Spawn Error]:", err);
        deviceController.sendErr(ERR_CODE.FFMPEG_SPAWN, `${err}`);
      });

      this.ffmpegProcess.on("exit", (code, signal) => {
        console.log(`[FFmpeg Process Exited] Code: ${code}, Signal: ${signal}`);
      });

      this.ffmpegProcess.stderr.on("data", (data) => {
        console.info(`[FFmpeg Log] ${data.toString()}`);
      });
    });
  };

  turnOffCamera = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!this.ffmpegProcess || this.ffmpegProcess.killed) {
        console.log("[FFmpeg] Process already dead or not started.");
        return resolve();
      }

      console.log(
        `[FFmpeg] Stopping process (PID: ${this.ffmpegProcess.pid})...`,
      );

      // 1. Set up a failsafe timeout. If SIGTERM ignores us, we force kill it.
      const forceKillTimeout = setTimeout(() => {
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
          console.warn(
            "[FFmpeg] Process did not exit with SIGTERM. Force killing...",
          );
          this.ffmpegProcess.kill("SIGKILL");
        }
        resolve();
      }, 2000);

      // 2. Listen for the actual exit event
      this.ffmpegProcess.once("exit", (code, signal) => {
        clearTimeout(forceKillTimeout);
        console.log(
          `[FFmpeg] Process exited cleanly. Code: ${code}, Signal: ${signal}`,
        );
        this.ffmpegProcess = null;
        resolve();
      });

      // 3. Send the graceful terminate signal (SIGTERM is default for .kill())
      try {
        if (this.ffmpegProcess.stdin && !this.ffmpegProcess.stdin.destroyed) {
          this.ffmpegProcess.stdin.end();
        }

        this.ffmpegProcess.kill("SIGTERM");
      } catch (error) {
        console.error("[FFmpeg] Error while sending kill signal:", error);

        deviceController.sendErr(ERR_CODE.FFMPEG_KILL_SIGNAL, `${error}`);

        clearTimeout(forceKillTimeout);
        resolve();
      }
    });
  };

  dispose = async () => {
    console.log("[WebRTCController] Starting full cleanup...");
    this.isConnected = false;
    this.iceCandidateQueue = [];
    this.isInit = false;

    await this.turnOffCamera();

    if (this.ffmpegProcess) {
      this.ffmpegProcess.stdout.removeAllListeners();
      this.ffmpegProcess.stderr.removeAllListeners();
      this.ffmpegProcess.stdout.destroy();

      const proc = this.ffmpegProcess;
      this.ffmpegProcess = null;

      if (!proc.killed) {
        console.log(
          "[FFmpeg] Process still alive after quit command. Sending SIGKILL...",
        );
        try {
          proc.kill("SIGKILL");
        } catch (e) {
          console.error("[FFmpeg] Error sending SIGKILL:", e);

          deviceController.sendErr(ERR_CODE.FFMPEG_KILL_SIGNAL, `${e}`);
        }
      }
    }

    if (this.udpServer) {
      const socketToClose = this.udpServer;
      this.udpServer = null;

      socketToClose.removeAllListeners("message");
      socketToClose.removeAllListeners("error");

      await new Promise<void>((resolve) => {
        try {
          socketToClose.close(() => {
            console.log("[UDP] Socket port 55555 successfully released by OS.");
            resolve();
          });
        } catch (err) {
          deviceController.sendErr(ERR_CODE.UDP_CLOSE, `${err}`);

          resolve();
        }
      });
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.onconnectionstatechange = null;
        this.peerConnection.onicecandidate = null;

        this.peerConnection.close();
        console.log("[WebRTC] Peer Connection closed cleanly.");
      } catch (err) {
        console.error("[WebRTC] Error closing peer connection:", err);

        deviceController.sendErr(ERR_CODE.WEBRTC_CLOSE, `${err}`);
      }
      this.peerConnection = null;
    }

    this.videoTrack = null;
  };

  private _onUdpError = (err: Error) => {
    console.error("[UDP Server Error]", err);
    deviceController.sendErr(ERR_CODE.UDP_ERR, `${err}`);
    this.dispose();
  };

  private _onUdpMessage = (msg: Buffer) => {
    if (
      this.videoTrack &&
      this.peerConnection?.connectionState === "connected"
    ) {
      try {
        this.videoTrack.writeRtp(msg);
      } catch (err) {
        console.error("[WebRTC] Error writing RTP packet:", err);

        deviceController.sendErr(ERR_CODE.UDP_ERR, `${err}`);
      }
    }
  };
}

export default new WebRTCController();
