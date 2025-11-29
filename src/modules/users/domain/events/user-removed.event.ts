import { BaseEvent } from '@/shared/common/base-event';
import { UserJSON } from '../entities/user.entity';

type Props = {
  occurredOn: Date;
} & UserJSON<'SNAKE_CASE'>;

export class UserRemovedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
