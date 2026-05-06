function PermissionDenied({ message = "Bạn không đủ quyền hạn để dùng chức năng này." }) {
  return (
    <div className="card p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">Không đủ quyền truy cập</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default PermissionDenied;
