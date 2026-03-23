import { Search } from "lucide-react";
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = keyword.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/products");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-soft transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </form>
  );
}

export default SearchBar;
