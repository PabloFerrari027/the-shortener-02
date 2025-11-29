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

function sleep(ms: number) {
  execSync(`node -e "setTimeout(() => {}, ${ms})"`, { stdio: 'ignore' });
}

function waitForPostgres(
  composeFile: string,
  projectName: string,
  maxRetries: number = 30,
  delayMs: number = 2000,
) {
  log(
    `\n➤ Waiting for PostgreSQL (${projectName}) to be ready...`,
    colors.blue,
  );

  for (let i = 1; i <= maxRetries; i++) {
    try {
      execSync(
        `docker compose --project-name ${projectName} -f ${composeFile} exec -T postgres pg_isready -U postgres`,
        {
          stdio: 'ignore',
        },
      );
      log(`  ✓ PostgreSQL (${projectName}) is ready!`, colors.green);
      return true;
    } catch {
      if (i === maxRetries) {
        log(
          `❌ PostgreSQL (${projectName}) did not become ready after ${maxRetries} attempts`,
          colors.red,
        );
        return false;
      }
      process.stdout.write(
        `  ⏳ Attempt ${i}/${maxRetries}... retrying in ${delayMs / 1000}s\r`,
      );
      sleep(delayMs);
    }
  }

  return false;
}

function copyEnvFiles() {
  try {
    log('\n➤ Creating environment files...', colors.blue);

    if (!existsSync('.env')) {
      copyFileSync('.env.example', '.env');
      log('  ✓ Created .env', colors.green);
    } else {
      log('  ⚠  .env already exists, skipping...', colors.yellow);
    }

    if (!existsSync('.env.test.local')) {
      copyFileSync('.env.example', '.env.test.local');
      log('  ✓ Created .env.test.local', colors.green);
    } else {
      log('  ⚠  .env.test.local already exists, skipping...', colors.yellow);
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

const prodReady = waitForPostgres(
  '.docker/docker-compose.prod.yml',
  'the-shortener-prod',
);

const testReady = waitForPostgres(
  '.docker/docker-compose.test.yml',
  'the-shortener-test',
);

if (!prodReady || !testReady) {
  log('\n❌ Setup failed: PostgreSQL is not ready', colors.red);
  process.exit(1);
}

exec('npm run migration:run', '➤ Applying migrations ...');

exec('npm run seed', '➤ Running seed ...');

log('\n✅ Setup completed successfully!', colors.green);
