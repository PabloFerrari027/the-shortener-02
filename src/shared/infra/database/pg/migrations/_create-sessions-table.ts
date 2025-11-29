import { Pool } from 'pg';
import { Migration } from './migration.interface';

export class CreateSessionsTableMigration implements Migration {
  async up(pg: Pool): Promise<void> {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        validated_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
        ON sessions(user_id);

      CREATE INDEX IF NOT EXISTS idx_sessions_active 
        ON sessions(closed_at, removed_at) 
        WHERE closed_at IS NULL AND removed_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_sessions_validated 
        ON sessions(validated_at) 
        WHERE validated_at IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
        ON sessions(user_id, closed_at, removed_at) 
        WHERE closed_at IS NULL AND removed_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_sessions_removed_at 
        ON sessions(removed_at);

      ALTER TABLE sessions
        ADD CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE;
    `);
  }

  async down(pg: Pool): Promise<void> {
    await pg.query(`
      ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_user;
      DROP INDEX IF EXISTS idx_sessions_removed_at;
      DROP INDEX IF EXISTS idx_sessions_user_active;
      DROP INDEX IF EXISTS idx_sessions_validated;
      DROP INDEX IF EXISTS idx_sessions_active;
      DROP INDEX IF EXISTS idx_sessions_user_id;
      DROP TABLE IF EXISTS sessions CASCADE;
    `);
  }
}
