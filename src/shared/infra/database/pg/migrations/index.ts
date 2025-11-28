import { CreateShortUrlTable } from './_create-short-url-table';
import { Migration } from './migration.interface';

export const migrations: Migration[] = [new CreateShortUrlTable()];
