import { useEffect } from "react";
import { X } from "lucide-react";
import cn from "@/utils/cn";

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "lg",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        className="absolute inset-0"
        role="button"
        aria-label="Đóng modal"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter") onClose?.();
        }}
      />
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
