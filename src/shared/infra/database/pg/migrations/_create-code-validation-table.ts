import { Pool } from 'pg';
import { Migration } from './migration.interface';

export class CreateCodeValidationsTableMigration implements Migration {
  async up(pg: Pool): Promise<void> {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS code_validations (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        value VARCHAR(6) UNIQUE NOT NULL,
        used_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_code_validations_value 
        ON code_validations(value) WHERE removed_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_code_validations_session_id 
        ON code_validations(session_id);

      CREATE INDEX IF NOT EXISTS idx_code_validations_used_at 
        ON code_validations(used_at) 
        WHERE used_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_code_validations_expires_at 
        ON code_validations(expires_at);

      CREATE INDEX IF NOT EXISTS idx_code_validations_removed_at 
        ON code_validations(removed_at);

      ALTER TABLE code_validations
        ADD CONSTRAINT fk_code_validations_session
        FOREIGN KEY (session_id) 
        REFERENCES sessions(id)
        ON DELETE CASCADE;
    `);
  }

  async down(pg: Pool): Promise<void> {
    await pg.query(`
      ALTER TABLE code_validations DROP CONSTRAINT IF EXISTS fk_code_validations_session;
      DROP INDEX IF EXISTS idx_code_validations_removed_at;
      DROP INDEX IF EXISTS idx_code_validations_expires_at;
      DROP INDEX IF EXISTS idx_code_validations_used_at;
      DROP INDEX IF EXISTS idx_code_validations_session_id;
      DROP INDEX IF EXISTS idx_code_validations_value;
      DROP TABLE IF EXISTS code_validations CASCADE;
    `);
  }
}
