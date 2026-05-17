import { Camera, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar({
  initialValue = "",
  placeholder = "Tìm kiếm sản phẩm, thương hiệu...",
  className = "",
}) {
  const [keyword, setKeyword] = useState(initialValue);
  const navigate = useNavigate();

  useEffect(() => {
    setKeyword(initialValue);
  }, [initialValue]);

  // Tìm kiếm bằng chữ
  const handleSubmit = (event) => {
    event.preventDefault();

    const value = keyword.trim();

    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/products");
  };

  // Tìm kiếm bằng hình ảnh
  const handleImageSearch = () => {
    navigate("/image-search");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative min-w-0 ${className}`}>
      {/* Icon kính lúp bên trái */}
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
      />

      {/* Ô nhập tìm kiếm
          pr-14 để chừa chỗ cho nút camera bên phải */}
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-14 text-sm shadow-soft transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:h-11 lg:h-12"
      />

      {/* Icon tìm kiếm bằng hình ảnh bên phải */}
      <button
        type="button"
        onClick={handleImageSearch}
        className="absolute right-1.5 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600 sm:right-2 sm:h-9 sm:w-9"
        title="Tìm kiếm bằng hình ảnh"
        aria-label="Tìm kiếm bằng hình ảnh"
      >
        <Camera size={17} />
      </button>
    </form>
  );
}

export default SearchBar;