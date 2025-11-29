import { PaginationOptions } from '@/shared/types/pagination-options.type';
import { User, UserProps } from '../entities/user.entity';
import { ListingResponse } from '@/shared/types/listing-response.type';

export interface UsersRepository {
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(
    options?: PaginationOptions<keyof UserProps>,
  ): Promise<ListingResponse<User>>;
  delete(id: string): Promise<void>;
}
