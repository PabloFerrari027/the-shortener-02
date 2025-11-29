import { BaseEvent } from '@/shared/common/base-event';
import { CodeValidationJSON } from '../entities/code-validation.entity';

type Props = {
  occurredOn: Date;
} & CodeValidationJSON<'SNAKE_CASE'>;

export class CodeValidationRemovedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
