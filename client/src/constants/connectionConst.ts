export const CONNECTION_STATE = {
  offline: "offline",
  connected: "connected",
  ready: "ready",
  connecting: "connecting",
} as const;

export type CONNECTION_TYPE = keyof typeof CONNECTION_STATE;

export const EVENT_NAME = "CONNECTION_STATE"