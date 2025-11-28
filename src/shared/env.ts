export enum NODE_ENV {
  'DEVELOPMENT' = 'DEVELOPMENT',
  'PRODUCTION' = 'PRODUCTION',
  'TEST-UNIT' = 'TEST-UNIT',
  'TEST-E2E' = 'TEST-E2E',
}

export class Env {
  static get APP_URL(): string {
    return process.env.APP_URL!;
  }
  static get NODE_ENV(): NODE_ENV {
    return process.env.APP_URL as NODE_ENV;
  }
  static get PORT(): number {
    return Number(process.env.PORT);
  }
  static get PG_HOST(): string {
    return process.env.PG_HOST!;
  }
  static get PG_PORT(): number {
    return Number(process.env.PG_PORT);
  }
  static get PG_NAME(): string {
    return process.env.PG_NAME!;
  }
  static get PG_USER(): string {
    return process.env.PG_USER!;
  }
  static get PG_PASS(): string {
    return process.env.PG_PASS!;
  }
}
