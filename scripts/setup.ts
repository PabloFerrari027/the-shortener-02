import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { colors } from './colors';
import { log } from './log';

function exec(command: string, description: string) {
  try {
    log(`\n${description}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch {
    log(`❌ Error: ${description}`, colors.red);
    return false;
  }
}

function copyEnvFiles() {
  try {
    log('\n➤ Creating environment files...', colors.blue);

    if (!existsSync('.env')) {
      copyFileSync('.env.example', '.env');
      log('  ✓ Created .env', colors.green);
    } else {
      log('  ⚠ .env already exists, skipping...', colors.yellow);
    }

    if (!existsSync('.env.test.local')) {
      copyFileSync('.env.example', '.env.test.local');
      log('  ✓ Created .env.test.local', colors.green);
    } else {
      log('  ⚠ .env.test.local already exists, skipping...', colors.yellow);
    }

    return true;
  } catch (error) {
    log(`❌ Error creating environment files: ${error}`, colors.red);
    return false;
  }
}

log('🚀 Starting project setup...', colors.cyan);

copyEnvFiles();

exec('npm install', '➤ Installing dependencies...');

exec(
  'npx commitizen init cz-conventional-changelog --save-dev --save-exact --force',
  '✨ Setting up Commitizen...',
);

exec('npm run docker:compose', '➤ Creating containers...');

exec('npm run migration:run', '➤ Applying migrations ...');

log('\n✅ Setup completed successfully!', colors.green);