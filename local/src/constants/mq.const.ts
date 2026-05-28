export const MQ_MSG = {
  DELETE: "DELETE",
  SIGNAL: "SIGNAL",
  STATUS: "STATUS",
  OFFER: "OFFER",
  ANSWER: "ANSWER",
  CANDIDATE: "CANDIDATE",
  CLOSE: "CLOSE",
} as const;

export type MQ_MSG_TYPE = keyof typeof MQ_MSG;

export type PAYLOAD_TYPE = {
  type: MQ_MSG_TYPE;
  data?: any;
};
