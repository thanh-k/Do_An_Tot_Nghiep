import EmptyState from "@/components/common/EmptyState";
import cn from "@/utils/cn";

function DataTable({ columns = [], data = [], rowKey = "id" }) {
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
            {data.map((row) => (
              <tr key={row[rowKey]} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-5 py-4 align-top text-sm text-slate-700",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
