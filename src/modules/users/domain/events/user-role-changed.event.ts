import { BaseEvent } from '@/shared/common/base-event';

type Props = {
  id: string;
  to: string;
  from: string;
  occurredOn: Date;
};

export class UserRoleChangedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
