import { Session } from '../../domain/entities/session.entity';

export interface ToControllerInput {
  session: Session;
  accessToken: string;
  refreshToken: string;
}

export interface ToControllerOutput {
  session_id: string;
  access_token: string;
  refresh_token: string;
}

export class SessionPresentation {
  static toController(input: ToControllerInput): ToControllerOutput {
    return {
      session_id: input.session.id,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
    };
  }
}
