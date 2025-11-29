import { BaseEvent } from '@/shared/common/base-event';
import { ShortUrlJSON } from '../entities/short-url.entity';

type Props = {
  occurredOn: Date;
} & ShortUrlJSON<'SNAKE_CASE'>;

export class ShortUrlRemovedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
