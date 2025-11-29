import { Session } from '../entities/session.entity';

export interface SessionsRepository {
  create(session: Session): Promise<void>;
  update(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
}
