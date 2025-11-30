import { MigrationRunner } from './../src/shared/infra/database/pg/migrations/migration.runner';
import * as dotenv from 'dotenv';

if (!process.env.CI) dotenv.config();

function log(message: string, color: string) {
  console.log(`${color}${message}${colors.reset}`);
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

async function runMigrations() {
  try {
    const runner = new MigrationRunner();
    const command = process.argv[2];

    if (command === 'rollback') await runner.rollbackLastMigration();
    else await runner.runMigrations();

    log('\n✅ Migration completed successfully!', colors.green);
  } catch (error) {
    log('\n❌ Migration failed', colors.red);
    log(`${error}`, '');
    process.exit(1);
  }
}

runMigrations();
