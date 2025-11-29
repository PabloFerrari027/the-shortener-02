import { Pool } from 'pg';
import { Migration } from './migration.interface';

export class CreateUsersTableMigration implements Migration {
  async up(pg: Pool): Promise<void> {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email
        ON users(email) WHERE removed_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_users_name 
        ON users(name);

      CREATE INDEX IF NOT EXISTS idx_users_removed_at 
        ON users(removed_at);
    `);
  }

  async down(pg: Pool): Promise<void> {
    await pg.query(`
      DROP INDEX IF EXISTS idx_users_removed_at;
      DROP INDEX IF EXISTS idx_users_name;
      DROP INDEX IF EXISTS idx_users_email;
      DROP TABLE IF EXISTS users CASCADE;
    `);
  }
}
