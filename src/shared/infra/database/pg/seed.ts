import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Env } from '@/shared/env';
import { PG } from '.';
import 'dotenv/config';

class Seed {
  async rootUser(pg: Pool): Promise<void> {
    const checkQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND removed_at IS NULL
      LIMIT 1
    `;

    const existingUser = await pg.query(checkQuery, [Env.ROOT_USER_EMAIL]);

    if (existingUser.rows.length > 0) {
      await pg.end();
      return;
    }

    const password = Env.ROOT_USER_PASS;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO users (
        id,
        name,
        email,
        password,
        role,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role
    `;

    const now = new Date();
    const values = [
      randomUUID(),
      Env.ROOT_USER_NAME,
      Env.ROOT_USER_EMAIL,
      hashedPassword,
      'ADMIN',
      now,
      now,
    ];

    await pg.query(insertQuery, values);
    await pg.end();
  }
}

const seed = new Seed();
// eslint-disable-next-line @typescript-eslint/no-floating-promises
Promise.all([seed.rootUser(PG.client)]);
