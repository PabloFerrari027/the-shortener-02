export const JSONFormats = {
  SNAKE_CASE: 'SNAKE_CASE',
  CAMEL_CASE: 'CAMEL_CASE',
} as const;
export type JSONFormat = (typeof JSONFormats)[keyof typeof JSONFormats];
