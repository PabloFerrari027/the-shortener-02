import { BaseEvent } from '@/shared/common/base-event';

interface Props {
  id: string;
  from: string;
  to: string;
  occurredOn: Date;
}

export class ShortUrlChangedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
