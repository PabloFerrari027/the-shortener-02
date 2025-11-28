export interface ListingResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
}
