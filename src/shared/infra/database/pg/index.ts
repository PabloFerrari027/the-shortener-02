import { Pool } from 'pg';
import { Env } from 'src/shared/env';

export class PG {
  private static _client: Pool;

  static get client(): Pool {
    if (this._client) return this._client;

    this._client = new Pool({
      host: Env.PG_HOST,
      port: Env.PG_PORT,
      database: Env.PG_NAME,
      user: Env.PG_USER,
      password: Env.PG_PASS,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    return this._client;
  }
}
