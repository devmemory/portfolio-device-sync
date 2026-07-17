export const MSG = {
  JOIN: 'JOIN', // socket connection
  DELETE: 'DELETE', // delete device
  SIGNAL: 'SIGNAL', // check signal
  STATUS: 'STATUS', // check device status
  OFFER: 'OFFER', // WebRTC offer(client)
  ANSWER: 'ANSWER', // WebRTC answer(local)
  CANDIDATE: 'CANDIDATE', // WebRTC candidate
  CLOSE: 'CLOSE', // close AMQP

  CHECK: 'CHECK', // check service

  READY: 'READY', // ai service ready
  CONVERSATION: 'CONVERSATION', // stream text
  SAVE_CONTENT: 'SAVE_CONTENT', // full text of conversation
} as const;

export const SERVICE_NAME = {
  AI: 'AI',
  MEDIA: 'MEDIA',
} as const;
