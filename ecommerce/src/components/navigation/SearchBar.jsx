import { Camera, Search, X, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import userProductService from "@/services/user/productService";

function SearchBar({
  initialValue = "",
  placeholder = "Tìm kiếm sản phẩm, thương hiệu...",
  className = "",
}) {
  const [keyword, setKeyword] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const debouncedKeyword = useDebounce(keyword, 300); // Đợi 300ms sau khi ngừng gõ mới gọi API

  useEffect(() => {
    setKeyword(initialValue);
  }, [initialValue]);

  // Tự động đóng Dropdown khi click ra ngoài thanh tìm kiếm
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch gọi API gợi ý sản phẩm
  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const items = await userProductService.getSearchSuggestions(
          debouncedKeyword.trim(),
          5,
        );
        setSuggestions(items);
        setShowDropdown(true);
      } catch (error) {
        console.error("Lỗi tải gợi ý:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [debouncedKeyword]);

  // Tìm kiếm bằng chữ
  const handleSubmit = (event) => {
    if (event) event.preventDefault();

    const value = keyword.trim();
    setShowDropdown(false);

    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/products");
  };

  // Tìm kiếm bằng hình ảnh
  const handleImageSearch = () => {
    navigate("/image-search");
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " ₫";

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Icon kính lúp bên trái */}
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
        />

        {/* Ô nhập tìm kiếm - Tăng pr-24 để chừa chỗ cho cả nút X và nút Camera */}
        <input
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => keyword.trim() && setShowDropdown(true)}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-24 text-sm shadow-soft transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:h-11 lg:h-12"
        />

        {/* Nút Xóa Text (Chỉ hiện khi có chữ) */}
        {keyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="absolute right-12 sm:right-14 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:h-8 sm:w-8"
          >
            <X size={14} />
          </button>
        )}

        {/* Icon tìm kiếm bằng hình ảnh bên phải (GIỮ NGUYÊN HOÀN TOÀN TỪ CODE CŨ) */}
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

      {/* KẾT QUẢ GỢI Ý (AUTO-SUGGEST DROPDOWN) */}
      {showDropdown && debouncedKeyword.trim() !== "" && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin text-brand-500" size={18} /> Đang
              tìm kiếm...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Sản phẩm gợi ý
              </div>
              <ul className="custom-scrollbar max-h-[320px] overflow-y-auto">
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(`/products/${product.slug}`);
                      }}
                      className="group flex w-full items-center gap-4 border-b border-slate-50 bg-white px-4 py-3 text-left transition-colors hover:bg-brand-50 last:border-0"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
                        <img
                          src={
                            product.thumbnail || product.variants?.[0]?.image
                          }
                          alt={product.name}
                          className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-700">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-brand-600">
                          {formatCurrency(
                            product.variants?.[0]?.price || product.price || 0,
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full border-t border-slate-100 bg-slate-50 p-3.5 text-center text-sm font-black uppercase tracking-wider text-brand-600 transition-all hover:bg-brand-600 hover:text-white"
              >
                Xem tất cả kết quả cho "{keyword}"
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search size={20} />
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                Không tìm thấy sản phẩm nào phù hợp với <br />
                <span className="font-bold text-slate-800">"{keyword}"</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
