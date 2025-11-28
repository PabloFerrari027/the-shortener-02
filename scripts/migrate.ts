import { MigrationRunner } from './../src/shared/infra/database/pg/migrations/migration.runner';

import * as dotenv from 'dotenv';
import { colors } from './colors';
import { log } from 'console';

if (!process.env.CI) dotenv.config();

async function runMigrations() {
  try {
    const runner = new MigrationRunner();
    const command = process.argv[2];

    if (command === 'rollback') await runner.rollbackLastMigration();
    else await runner.runMigrations();

    log('\n✅ Migration completed successfully!', colors.green);
  } catch (error) {
    log('\n❌ Migration failed', colors.red);
    log(error);
    process.exit(1);
  }
}

runMigrations();
