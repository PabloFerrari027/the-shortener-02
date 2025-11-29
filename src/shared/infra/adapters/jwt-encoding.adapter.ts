import { Env } from '@/shared/env';
import { EncodingPort } from '@/shared/ports/encoding.port';
import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JWTEncodingAdapter implements EncodingPort {
  constructor() {}

  async encode(value: string): Promise<string> {
    const result = jwt.sign(value, Env.ENCODE_SECRET);
    return result;
  }

  async dencode(value: string): Promise<string> {
    const result = JSON.stringify(
      jwt.verify(value, Env.ENCODE_SECRET, {
        ignoreExpiration: true,
      }),
    );

    return result;
  }
}
