export interface IceCandidateModel {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

export type OnIceCandidateType = (model: IceCandidateModel) => void;
