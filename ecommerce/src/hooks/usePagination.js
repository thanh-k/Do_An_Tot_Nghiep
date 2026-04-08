import { useMemo } from "react";

export function usePagination({ data = [], pageSize = 8, currentPage = 1 }) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, pageSize]);

  const goToPage = (page) => {
    return Math.min(Math.max(page, 1), totalPages);
  };

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    hasNextPage,
    hasPrevPage,
  };
}

export default usePagination;
