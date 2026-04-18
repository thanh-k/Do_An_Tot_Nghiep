import { useEffect, useState } from "react";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import cn from "@/utils/cn";

function DataTable({
  columns = [],
  data = [],
  rowKey = "id",
  pagination,
}) {
  const pageSize = pagination?.pageSize ?? 10;
  const itemLabel = pagination?.itemLabel ?? "bản ghi";
  const enablePagination = Boolean(pagination?.enabled) && data.length > pageSize;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedData = enablePagination
    ? data.slice((safePage - 1) * pageSize, safePage * pageSize)
    : data;

  if (!data.length) {
    return (
      <EmptyState
        title="Chưa có dữ liệu trong bảng"
        description="Hãy thử điều chỉnh bộ lọc hoặc thêm dữ liệu mới."
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedData.map((row, index) => (
              <tr key={row[rowKey]} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-5 py-4 align-top text-sm text-slate-700",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.render ? column.render(row, (safePage - 1) * pageSize + index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enablePagination ? (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={data.length}
            pageSize={pageSize}
            itemLabel={itemLabel}
            onPageChange={(page) => {
              setCurrentPage(Math.min(Math.max(page, 1), totalPages));
              if (typeof pagination?.onPageChange === "function") {
                pagination.onPageChange(page);
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
