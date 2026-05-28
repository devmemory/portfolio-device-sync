export const MSG = {
  JOIN: "JOIN", // socket connection
  DELETE: 'DELETE', // delete device
  SIGNAL: 'SIGNAL', // check signal
  STATUS: 'STATUS', // check device status
  OFFER: 'OFFER', // WebRTC offer(client)
  ANSWER: 'ANSWER', // WebRTC answer(local)
  CANDIDATE: 'CANDIDATE', // WebRTC candidate
  CLOSE: 'CLOSE', // close mqtt
} as const;
