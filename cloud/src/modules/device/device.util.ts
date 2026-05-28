import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

export const deviceNameUtil = {
  getQueueName: (machineId: string) => {
    return `q_device_${machineId}`;
  },
};

export class DeviceUtil {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    const key = process.env.MQ_SECRET;
    if (!key) {
      throw new Error('ENCRYPTION_KEY is not set');
    }

    // heavy task
    this.encryptionKey = scryptSync(key, 'salt', 32);
  }

  encrypt = (text: string): string => {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8');

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  };

  decrypt = (text: string): string => {
    const [ivHex, tagHex, encryptedHex] = text.split(':');

    console.log({ ivHex, tagHex, encryptedHex });

    if (!ivHex || !tagHex || !encryptedHex) {
      throw new Error(
        'Invalid encrypted text format. Expected iv:tag:encrypted',
      );
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  };
}
