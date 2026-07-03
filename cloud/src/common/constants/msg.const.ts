export const MSG = {
  JOIN: "JOIN", // socket connection
  DELETE: 'DELETE', // delete device
  SIGNAL: 'SIGNAL', // check signal
  STATUS: 'STATUS', // check device status
  OFFER: 'OFFER', // WebRTC offer(client)
  ANSWER: 'ANSWER', // WebRTC answer(local)
  CANDIDATE: 'CANDIDATE', // WebRTC candidate
  CLOSE: 'CLOSE', // close mqtt
  CHECK: 'CHECK' // check service
} as const;

export const SERVICE_NAME = {
  AI: "AI",
  MEDIA: "MEDIA",
} as const;

export const REALTIME_EVENT = "REALTIME_EVENT"