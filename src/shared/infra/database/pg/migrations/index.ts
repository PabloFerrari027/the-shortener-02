import { CreateCodeValidationsTableMigration } from './_create-code-validation-table';
import { CreateSessionsTableMigration } from './_create-sessions-table';
import { CreateShortUrlTable } from './_create-short-url-table';
import { CreateUsersTableMigration } from './_create-users-table';
import { Migration } from './migration.interface';

export const migrations: Migration[] = [
  new CreateShortUrlTable(),
  new CreateUsersTableMigration(),
  new CreateSessionsTableMigration(),
  new CreateCodeValidationsTableMigration(),
];
