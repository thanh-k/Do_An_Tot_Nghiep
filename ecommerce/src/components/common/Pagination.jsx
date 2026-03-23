import Button from "@/components/common/Button";
import cn from "@/utils/cn";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Trước
      </Button>

      {pages.map((page) => (
        <button
          key={page}
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
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau
      </Button>
    </div>
  );
}

export default Pagination;
