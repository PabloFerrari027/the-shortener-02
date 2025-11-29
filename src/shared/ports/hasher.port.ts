export interface HasherPort {
  hash(value: string): Promise<string>;
  compare(value: string, hash: string): Promise<boolean>;
}
