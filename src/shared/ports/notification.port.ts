export interface NotificationPort {
  send(to: string, head: string, body: string): Promise<void>;
}
