import {
  CONNECTION_STATE,
  CONNECTION_TYPE,
  EVENT_NAME,
  MSG,
  WebRTC_CMD,
} from "src/constants";
import { WsService } from "./ws";

interface IceCandidateModel {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

export class WebRTCService extends WsService {
  private peerConnection: RTCPeerConnection | null = null;
  private retry = true;
  private videoTag: HTMLVideoElement | null = null;
  private emitter = new EventTarget();
  private iceCandidateQueue: IceCandidateModel[] = [];
  private turnInfo: any;
  public connectionState: CONNECTION_TYPE = CONNECTION_STATE.offline;

  constructor(private deviceId: number) {
    super({ deviceId, url: `${import.meta.env.VITE_WS_BASE_URL}/device` });
  }

  initPeer = () => {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, this.turnInfo],
    });

    this.peerConnection.addTransceiver("video", { direction: "recvonly" });

    this.peerConnection.ontrack = this._onTrack;
    this.peerConnection.onicecandidate = this._onIceCandidate;
    this.peerConnection.onconnectionstatechange = this._onPeerConnectionState;
  };

  initListner = () => {
    this.on(WebRTC_CMD.ANSWER, this._answer);

    this.on(WebRTC_CMD.CANDIDATE, this._addIceCandidate);

    this.on(MSG.SIGNAL, this._onSignal);
  };

  sendOffer = async () => {
    if (!this.peerConnection) {
      return;
    }

    this.connectionState = CONNECTION_STATE.connecting;
    this._onEventChange();

    const offer = await this.peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false,
    });

    await this.peerConnection.setLocalDescription(offer);

    this.emit(WebRTC_CMD.OFFER, { deviceId: this.deviceId, ...offer });
  };

  disposeAll = () => {
    this.disposePeer();
    this.disposeSocket();
  };

  disposePeer = () => {
    this.connectionState = CONNECTION_STATE.ready;
    this._onEventChange();
    this.iceCandidateQueue = [];

    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.emit(WebRTC_CMD.CLOSE, { deviceId: this.deviceId });
  };

  set video(el: HTMLVideoElement | null) {
    if (el === null) {
      return;
    }

    this.videoTag = el;
  }

  onChangeConnection = (callback: () => void) => {
    this.emitter.addEventListener(EVENT_NAME, callback);

    return () => this.emitter.removeEventListener(EVENT_NAME, callback);
  };

  private _onPeerConnectionState = (e: Event) => {
    console.log("[WebRTC] connection : ", this.peerConnection?.connectionState);

    switch (this.peerConnection!.connectionState) {
      case "connected":
        this.connectionState = CONNECTION_STATE.connected;
        this._onEventChange();
        break;
      case "closed":
      case "disconnected":
        this.disposePeer();
        break;
      case "failed":
        if (this.retry) {
          this.retry = false;
          this.disposePeer();
          this.initPeer();
          this.sendOffer();
          break;
        }
        break;
    }
  };

  private _onEventChange = () => {
    this.emitter.dispatchEvent(new Event(EVENT_NAME));
  };

  private _addIceCandidate = async (data: any) => {
    await this.peerConnection?.addIceCandidate(data);
  };

  private _answer = async (data: any) => {
    await this.peerConnection?.setRemoteDescription(data);

    console.log(
      "[WebRTC] receive answer",
      this.connectionState,
      this.iceCandidateQueue.length,
    );

    this.iceCandidateQueue.forEach(({ candidate, sdpMid, sdpMLineIndex }) => {
      if (this.connectionState !== CONNECTION_STATE.connected) {
        this.emit(WebRTC_CMD.CANDIDATE, {
          candidate,
          sdpMid,
          sdpMLineIndex,
          deviceId: this.deviceId,
        });
      }
    });
  };

  private _onTrack = (e: RTCTrackEvent) => {
    const [stream] = e.streams;

    console.log({ stream, tag: this.videoTag });

    if (!stream || !this.videoTag) {
      return;
    }

    this.videoTag.srcObject = stream;
  };

  private _onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = e.candidate;

      if (sdpMid === null || sdpMLineIndex === null) {
        return;
      }

      this.iceCandidateQueue.push({ candidate, sdpMid, sdpMLineIndex });
    }
  };

  private _onSignal = (data: any) => {
    console.log({ data });
    this.turnInfo = JSON.parse(data);

    this.connectionState = CONNECTION_STATE.ready;
    this._onEventChange();
  };
}
