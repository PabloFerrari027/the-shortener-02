export class Sort {
  static execute<T>(
    data: Array<T>,
    order: 'asc' | 'desc',
    sortBy: keyof T,
  ): Array<T> {
    const sortedData = [...data];

    sortedData.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];

      if (!valueA || !valueB) return 0;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return order === 'asc'
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    return sortedData;
  }
}
