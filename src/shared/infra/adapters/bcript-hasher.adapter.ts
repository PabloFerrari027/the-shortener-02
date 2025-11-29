import bcrypt from 'bcrypt';
import { HasherPort } from '@/shared/ports/hasher.port';

export class BcrtiptHasherAdapter implements HasherPort {
  async hash(value: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
  }
  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
