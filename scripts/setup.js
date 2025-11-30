import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function exec(command, description) {
  try {
    log(`\n${description}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch {
    log(`❌ Error: ${description}`, colors.red);
    return false;
  }
}

function sleep(ms) {
  execSync(`node -e "setTimeout(() => {}, ${ms})"`, { stdio: 'ignore' });
}

function waitForPostgres(
  composeFile,
  projectName,
  maxRetries = 30,
  delayMs = 2000,
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

function copyEnvFile() {
  try {
    log('\n➤ Creating environment files...', colors.blue);

    if (!existsSync('.env')) {
      copyFileSync('.env.example', '.env');
      log('  ✓ Created .env', colors.green);
    } else {
      log('  ⚠  .env already exists, skipping...', colors.yellow);
    }

    return true;
  } catch (error) {
    log(`❌ Error creating environment files: ${error}`, colors.red);
    return false;
  }
}

function log(message, color) {
  console.log(`${color}${message}${colors.reset}`);
}

log('🚀 Starting project setup...', colors.cyan);

copyEnvFile();

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

if (!prodReady) {
  log('\n❌ Setup failed: PostgreSQL is not ready', colors.red);
  process.exit(1);
}

exec('npm run migration:run', '➤ Applying migrations ...');

exec('npm run seed', '➤ Running seed ...');

log('\n✅ Setup completed successfully!', colors.green);
