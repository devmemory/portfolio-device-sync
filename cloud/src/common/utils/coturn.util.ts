import { createHmac } from 'crypto';

export const getTurnInfo = () => {
  const validDurationSeconds = 3600; // 1 hour
  const expiryTime = Math.floor(Date.now() / 1000) + validDurationSeconds;

  const username = `${expiryTime}:my_users`;

  const password = createHmac('sha1', process.env.TURN_SECRET!)
    .update(username)
    .digest('base64');

  return {
    urls: `turn:${process.env.TURN_REALM}?transport=udp`,
    username: username,
    credential: password,
  };
};
