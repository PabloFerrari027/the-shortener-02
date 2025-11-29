import { Pool } from 'pg';
import {
  CodeValidation,
  JSONFormats,
} from '../../domain/entities/code-validation.entity';
import { CodeValidationRepository } from '../../domain/repositories/code-validation.repository';
import { PG } from '@/shared/infra/database/pg';

export class PgCodeValidationRepository implements CodeValidationRepository {
  private pool: Pool;

  constructor() {
    this.pool = PG.client;
  }

  private mapRowToEntity(row: any): CodeValidation {
    return CodeValidation.fromJSON(JSONFormats.SNAKE_CASE, {
      id: row.id,
      created_at: row.created_at,
      expires_at: row.expires_at,
      session_id: row.session_id,
      updated_at: row.updated_at,
      used_at: row.used_at,
      value: row.value,
    });
  }

  async create(codevalidation: CodeValidation): Promise<CodeValidation> {
    const query = `
      INSERT INTO code_validations (id, session_id, value, used_at, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      codevalidation.id,
      codevalidation.sessionId,
      codevalidation.value,
      codevalidation.usedAt || null,
      codevalidation.expiresAt,
      codevalidation.createdAt,
      codevalidation.updatedAt,
    ];

    const result = await this.pool.query(query, values);

    return this.mapRowToEntity(result.rows[0]);
  }

  async save(codevalidation: CodeValidation): Promise<CodeValidation> {
    const query = `
      UPDATE code_validations
      SET session_id = $1,
          value = $2,
          used_at = $3,
          expires_at = $4,
          updated_at = $5
      WHERE id = $6 AND removed_at IS NULL
      RETURNING *
    `;

    const values = [
      codevalidation.sessionId,
      codevalidation.value,
      codevalidation.usedAt || null,
      codevalidation.expiresAt,
      new Date(),
      codevalidation.id,
    ];

    const result = await this.pool.query(query, values);

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByValue(value: string): Promise<CodeValidation | null> {
    const query = `
      SELECT * FROM code_validations
      WHERE value = $1 AND removed_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [value]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = `
      UPDATE code_validations
      SET removed_at = $1, updated_at = $1
      WHERE id = $2 AND removed_at IS NULL
    `;

    await this.pool.query(query, [new Date(), id]);
  }
}
