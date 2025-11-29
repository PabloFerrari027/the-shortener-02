import { BaseEvent } from '@/shared/common/base-event';

interface Props {
  id: string;
  occurredOn: Date;
}

export class CodeValidationUsedEvent extends BaseEvent<Props> {
  constructor(readonly props: Props) {
    super(props);
  }
}
