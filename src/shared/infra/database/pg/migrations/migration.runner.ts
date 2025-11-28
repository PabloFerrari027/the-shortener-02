import { PG } from '..';
import { migrations } from './index';

export class MigrationRunner {
  private pg = PG.client;

  async createMigrationsTable(): Promise<void> {
    await this.pg.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pg.query(
      'SELECT name FROM migrations ORDER BY id',
    );
    return result.rows.map((row) => row.name);
  }

  async runMigrations(): Promise<void> {
    await this.createMigrationsTable();
    const executed = await this.getExecutedMigrations();

    for (const migration of migrations.values()) {
      const migrationName = migration.constructor.name;

      if (!executed.includes(migrationName)) {
        console.log(`Running migration: ${migrationName}`);

        const client = await this.pg.connect();
        try {
          await client.query('BEGIN');
          await migration.up(this.pg);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [
            migrationName,
          ]);
          await client.query('COMMIT');
          console.log(`✓ Migration ${migrationName} completed`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`✗ Migration ${migrationName} failed:`, error);
          throw error;
        } finally {
          client.release();
        }
      }
    }

    await this.pg.end();
  }

  async rollbackLastMigration(): Promise<void> {
    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigrationName = executed[executed.length - 1];
    const migration = migrations.find(
      (m) => m.constructor.name === lastMigrationName,
    );

    if (!migration) {
      throw new Error(`Migration ${lastMigrationName} not found`);
    }

    console.log(`Rolling back migration: ${lastMigrationName}`);

    const client = await this.pg.connect();
    try {
      await client.query('BEGIN');
      await migration.down(this.pg);
      await client.query('DELETE FROM migrations WHERE name = $1', [
        lastMigrationName,
      ]);
      await client.query('COMMIT');
      console.log(`✓ Rollback ${lastMigrationName} completed`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`✗ Rollback ${lastMigrationName} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}
