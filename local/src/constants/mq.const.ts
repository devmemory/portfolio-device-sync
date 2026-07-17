export const MQ_MSG = {
  DELETE: "DELETE",
  SIGNAL: "SIGNAL",
  STATUS: "STATUS",
  OFFER: "OFFER",
  ANSWER: "ANSWER",
  CANDIDATE: "CANDIDATE",
  CHECK: "CHECK",
  CLOSE: "CLOSE",

  READY: "READY",
  CONVERSATION: "CONVERSATION",
  SAVE_CONTENT: "SAVE_CONTENT",
} as const;

export type MQ_MSG_TYPE = keyof typeof MQ_MSG;

export type PAYLOAD_TYPE = {
  type: MQ_MSG_TYPE;
  data?: any;
};

export const SERVICE_NAME = {
  AI: "AI",
  MEDIA: "MEDIA",
} as const;
