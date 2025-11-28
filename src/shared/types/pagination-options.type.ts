export enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

export interface PaginationOptions<T> {
  page?: number;
  orderBy?: T;
  order?: Order;
}
