import { User } from '../entities/user.entity';

export interface UsersRepository {
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}
