import { Link } from "react-router-dom";

function CategoryMenu({ categories = [], onClick }) {
  return (
    <div className="hidden border-t border-slate-200 bg-white lg:block">
      <div className="container-padded flex flex-wrap items-center gap-2 py-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${category.id}`}
            onClick={onClick}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );  
}

export default CategoryMenu;
