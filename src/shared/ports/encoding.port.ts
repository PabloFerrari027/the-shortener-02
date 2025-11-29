export interface EncodingPort {
  encode(value: string): Promise<string>;
  dencode(value: string): Promise<string>;
}
