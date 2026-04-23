import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/common/Button";
import cn from "@/utils/cn";

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
}

function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  hasPrevPage,
  hasNextPage,
  className,
  showSummary = true,
  totalItems = 0,
  pageSize = 0,
  itemLabel = "mục",
}) {
  if (totalPages <= 1) return null;

  const safeHasPrevPage = typeof hasPrevPage === "boolean" ? hasPrevPage : currentPage > 1;
  const safeHasNextPage = typeof hasNextPage === "boolean" ? hasNextPage : currentPage < totalPages;
  const pages = buildPageNumbers(currentPage, totalPages);

  const startItem = totalItems > 0 && pageSize > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems > 0 && pageSize > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      {showSummary ? (
        <p className="text-sm text-slate-500">
          {totalItems > 0 && pageSize > 0
            ? `tổng  ${totalItems} ${itemLabel}`
            : `Trang ${currentPage} / ${totalPages}`}
        </p>
      ) : (
        <span />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={!safeHasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </Button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm font-medium text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={cn(
                "flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition",
                currentPage === page
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-600"
              )}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={!safeHasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
