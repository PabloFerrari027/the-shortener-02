import { Pool } from 'pg';
import { User, JSONFormats } from '../../domain/entities/user.entity';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { PG } from '@/shared/infra/database/pg';

export class PgUsersRepository implements UsersRepository {
  private pool: Pool;

  constructor() {
    this.pool = PG.client;
  }

  private mapRowToEntity(row: any): User {
    return User.fromJSON(JSONFormats.SNAKE_CASE, {
      id: row.id,
      created_at: row.created_at,
      email: row.email,
      name: row.name,
      password: row.password,
      role: row.role,
      updated_at: row.updated_at,
    });
  }

  async create(user: User): Promise<void> {
    const query = `
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
      RETURNING *
    `;

    const values = [
      user.id,
      user.name.value,
      user.email.value,
      user.password.value,
      user.role,
      user.createdAt,
      user.updatedAt,
    ];

    await this.pool.query(query, values);
  }

  async update(user: User): Promise<void> {
    const query = `
      UPDATE users
      SET name = $1,
          email = $2,
          password = $3,
          role = $4,
          updated_at = $5
      WHERE id = $6 AND removed_at IS NULL
      RETURNING *
    `;

    const values = [
      user.name.value,
      user.email.value,
      user.password.value,
      user.role,
      new Date(),
      user.id,
    ];

    await this.pool.query(query, values);
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1 AND removed_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1 AND removed_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [email]);

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = `
      UPDATE sessions
      SET removed_at = $1, updated_at = $1
      WHERE user_id = $2 AND removed_at IS NULL;
      
      UPDATE code_validations
      SET removed_at = $1, updated_at = $1
      WHERE session_id IN (
        SELECT id FROM sessions WHERE user_id = $2
      ) AND removed_at IS NULL;
      
      UPDATE users
      SET removed_at = $1, updated_at = $1
      WHERE id = $2 AND removed_at IS NULL
    `;

    await this.pool.query(query, [new Date(), id]);
  }
}
