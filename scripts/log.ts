import { colors } from './colors';

export function log(message: string, color: string) {
  console.log(`${color}${message}${colors.reset}`);
}
