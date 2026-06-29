import React, { useState, useRef, useCallback } from "react";
import {
  ImagePlus,
  UploadCloud,
  Camera,
  X,
  ScanSearch,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import Webcam from "react-webcam";

function ImageUploader({
  file,
  previewUrl,
  onChange,
  onClear,
  isCameraOpen,
  setIsCameraOpen,
}) {
  const webcamRef = useRef(null);

  // Hàm xử lý khi bấm nút chụp ảnh
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Chuyển đổi ảnh Base64 từ Webcam thành dạng File (để giống với khi chọn file từ máy)
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const capturedFile = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });

      onChange(capturedFile);
      setIsCameraOpen(false); // Tắt camera sau khi chụp
    }
  }, [webcamRef, onChange]);

  return (
    <div className="card overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      {/* NẾU ĐANG MỞ CAMERA */}
      {isCameraOpen ? (
        <div className="flex flex-col items-center justify-center bg-slate-900 p-6">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-black">
            {/* Style cho tia quét AI */}
            <style>{`
              @keyframes ai-scan {
                0% { top: 0%; opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            `}</style>

            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={
                true
              } /* Thêm dòng này để lật lại camera giống soi gương */
              className="w-full object-cover"
              videoConstraints={{ facingMode: "environment" }}
            />

            {/* Hiệu ứng khung ngắm quét AI (Viewfinder) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
              <div className="w-full aspect-square max-w-[260px] relative">
                {/* 4 Góc bo */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/70 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/70 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/70 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/70 rounded-br-2xl"></div>
                {/* Tia quét */}
                <div
                  className="absolute left-0 w-full h-[2px] bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,1)]"
                  style={{ animation: "ai-scan 2.5s ease-in-out infinite" }}
                ></div>
              </div>
              <p className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mt-8 drop-shadow-md bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
                Hướng camera vào sản phẩm
              </p>
            </div>

            <button
              onClick={() => setIsCameraOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-rose-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-12 w-full max-w-md">
            {/* Nút ẩn bên trái để giữ layout nút chụp nằm cân đối ở giữa */}
            <div className="w-[46px] hidden sm:block"></div>

            {/* Nút chụp ảnh trực tiếp ở giữa (iOS Shutter Button Style) */}
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capture();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capture();
              }}
              className="group relative flex items-center justify-center cursor-pointer"
            >
              <div className="absolute inset-0 h-[76px] w-[76px] -translate-x-[6px] -translate-y-[6px] rounded-full border-[3px] border-white/80 transition-transform duration-300 group-hover:scale-[1.05] group-active:scale-[0.95]"></div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-transform duration-300 group-active:scale-90">
                <ScanSearch
                  size={26}
                  strokeWidth={2.5}
                  className="text-slate-900"
                />
              </div>
            </button>

            {/* Nút mở thư viện ảnh bên phải (iOS Gallery Style) */}
            <label className="flex cursor-pointer flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-lg">
                <ImageIcon size={22} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                Thư viện
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    onChange(event.target.files[0]);
                    setIsCameraOpen(false);
                  }
                }}
              />
            </label>
          </div>
        </div>

      ) : (
        /* NẾU KHÔNG MỞ CAMERA (Giao diện Upload bình thường) */
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-white p-5 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
            {previewUrl ? <ImagePlus size={20} /> : <UploadCloud size={20} />}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {file ? "Đổi ảnh tìm kiếm" : "Upload hoặc Chụp ảnh sản phẩm"}
            </h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            {/* Nút 1: Chọn file (Chỉ hiển thị trên Desktop) */}
            <label className="hidden lg:flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 shadow-sm">
              <UploadCloud size={14} />
              <span>Chọn ảnh từ máy</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onChange(event.target.files?.[0])}
              />
            </label>

            {/* Nút 2: Bật Camera UI (Ẩn trên PC, hiện trên Mobile & Tablet) - Premium AI Style */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="group flex lg:hidden cursor-pointer items-center gap-2 rounded-[2.5rem] bg-white px-4 py-2 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.15)] border border-slate-100 transition-all active:scale-95"
            >
              <div className="relative flex h-[28px] w-[28px] items-center justify-center rounded-full bg-slate-50">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-rose-500 opacity-20 blur-[2px] group-hover:opacity-40 transition-opacity"></div>
                <Camera
                  size={14}
                  strokeWidth={2.5}
                  className="relative z-10 text-slate-800"
                />
                <Sparkles
                  size={8}
                  className="absolute -top-0.5 -right-0.5 text-rose-500 animate-pulse z-20"
                />
              </div>
              <span className="text-xs font-black text-slate-800 tracking-tight">
                Tìm Bằng Camera AI
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
