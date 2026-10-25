import { useState } from 'react';

type SortValue = string | number | null | undefined;
export function useTableSort() {
  const [sort, setSort] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  function sortProps(key: string) {
    return {
      onSort: () => setSort(current => ({ key, direction: current?.key === key && current.direction === 'ascending' ? 'descending' : 'ascending' })),
      direction: sort?.key === key ? sort.direction : undefined,
    };
  }
  function sortRows<T>(rows: readonly T[], accessors: Record<string, (row: T) => SortValue>): T[] {
    if (!sort || !accessors[sort.key]) return [...rows];
    const get = accessors[sort.key];
    return [...rows].sort((a, b) => {
      const left = get(a) ?? ''; const right = get(b) ?? '';
      const compared = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'ascending' ? compared : -compared;
    });
  }
  return { sortRows, sortProps };
}
