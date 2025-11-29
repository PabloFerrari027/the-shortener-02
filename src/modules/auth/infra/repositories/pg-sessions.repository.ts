import { Pool } from 'pg';
import { Session, JSONFormats } from '../../domain/entities/session.entity';
import { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { PG } from '@/shared/infra/database/pg';

export class PgSessionsRepository implements SessionsRepository {
  private pool: Pool;

  constructor() {
    this.pool = PG.client;
  }

  private mapRowToEntity(row: any): Session {
    return Session.fromJSON(JSONFormats.SNAKE_CASE, {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      closed_at: row.closed_at,
      validated_at: row.validated_at,
    });
  }

  async create(session: Session): Promise<void> {
    const query = `
      INSERT INTO sessions (
        id, 
        user_id, 
        validated_at, 
        closed_at, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      session.id,
      session.userId,
      session.validatedAt || null,
      session.closedAt || null,
      session.createdAt,
      session.updatedAt,
    ];

    await this.pool.query(query, values);
  }

  async update(session: Session): Promise<void> {
    const query = `
      UPDATE sessions
      SET user_id = $1,
          validated_at = $2,
          closed_at = $3,
          updated_at = $4
      WHERE id = $5 AND removed_at IS NULL
      RETURNING *
    `;

    const values = [
      session.userId,
      session.validatedAt || null,
      session.closedAt || null,
      new Date(),
      session.id,
    ];

    await this.pool.query(query, values);
  }

  async findById(id: string): Promise<Session | null> {
    const query = `
      SELECT * FROM sessions
      WHERE id = $1 AND removed_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = `
      UPDATE sessions
      SET removed_at = $1, updated_at = $1
      WHERE id = $2 AND removed_at IS NULL
    `;

    await this.pool.query(query, [new Date(), id]);
  }
}
