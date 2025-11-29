import { NotificationPort } from '@/shared/ports/notification.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryNotificationAdapter implements NotificationPort {
  async send(to: string, head: string, body: string): Promise<void> {
    console.log({ to, head, body });
  }
}
