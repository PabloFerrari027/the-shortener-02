import { BaseEvent } from '@/shared/common/base-event';

interface Props {
  id: string;
  occurredOn: Date;
}

export class UserCreatedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
