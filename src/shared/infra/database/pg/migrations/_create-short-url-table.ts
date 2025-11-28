import { Pool } from 'pg';
import { Migration } from './migration.interface';

export class CreateShortUrlTable implements Migration {
  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hash VARCHAR(50) UNIQUE NOT NULL,
        url TEXT NOT NULL,
        click_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_short_urls_hash 
        ON short_urls(hash) WHERE removed_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_short_urls_created_at 
        ON short_urls(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_short_urls_click_count 
        ON short_urls(click_count DESC);

      CREATE INDEX IF NOT EXISTS idx_short_urls_removed_at 
        ON short_urls(removed_at);

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_short_urls_updated_at 
        BEFORE UPDATE ON short_urls
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP TRIGGER IF EXISTS update_short_urls_updated_at ON short_urls;
      
      DROP FUNCTION IF EXISTS update_updated_at_column();
      
      DROP TABLE IF EXISTS short_urls CASCADE;
    `);
  }
}
