import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { User } from './entities/user.entity';

const pbkdf2Async = promisify(pbkdf2);

export const userUtil = {
  safeUser: (userData: User) => {
    const { pw, refreshToken, tokenVersion, ...user } = userData;

    return { user };
  },
  hashPassword: async (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = await pbkdf2Async(password, salt, 100000, 64, 'sha512');
    return `${salt}:${hash.toString('hex')}`;
  },

  verifyPassword: async (password: string, stored: string) => {
    const [salt, hash] = stored.split(':');
    const hashVerify = await pbkdf2Async(password, salt, 100000, 64, 'sha512');
    return hash === hashVerify.toString('hex');
  },
};
