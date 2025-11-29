import { User, UserJSON } from '../../domain/entities/user.entity';

export type ToControllerOut = Omit<UserJSON<'SNAKE_CASE'>, 'password'>;

export type ToControllerListOut = {
  data: ToControllerOut[];
  total_pages: number;
  current_page?: number;
};

export class UserPresentation {
  static toController(user: User): ToControllerOut;

  static toController(
    user: User[],
    totalPages: number,
    currentPage: number,
  ): ToControllerListOut;

  static toController(
    input: User | User[],
    totalPages?: number,
    currentPage?: number,
  ): ToControllerOut | ToControllerListOut {
    if (Array.isArray(input)) {
      return {
        total_pages: totalPages!,
        current_page: currentPage!,
        data: input.map((user) => {
          const output = user.toJSON('SNAKE_CASE') as any;
          delete output.password;
          return output;
        }),
      };
    }

    const output = input.toJSON('SNAKE_CASE') as any;
    delete output.password;
    return output;
  }
}
