import { BaseEvent } from '@/shared/common/base-event';
import { SessionJSON } from '../entities/session.entity';

type Props = {
  occurredOn: Date;
} & SessionJSON<'SNAKE_CASE'>;

export class SessionRemovedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
