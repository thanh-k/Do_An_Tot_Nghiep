import React, { useState, useRef, useCallback } from "react";
import { ImagePlus, UploadCloud, Camera, X, Aperture } from "lucide-react";
import Webcam from "react-webcam";

function ImageUploader({ file, previewUrl, onChange, onClear }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  // Hàm xử lý khi bấm nút chụp ảnh
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Chuyển đổi ảnh Base64 từ Webcam thành dạng File (để giống với khi chọn file từ máy)
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      
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
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={true} /* Thêm dòng này để lật lại camera giống soi gương */
              className="w-full object-cover"
              videoConstraints={{ facingMode: "environment" }}
            />
            <button
              onClick={() => setIsCameraOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-rose-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={capture}
              className="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-500 hover:scale-105"
            >
              <Aperture size={20} />
              Chụp ảnh ngay
            </button>
          </div>
        </div>
      ) : (
        /* NẾU KHÔNG MỞ CAMERA (Giao diện Upload bình thường) */
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            {previewUrl ? <ImagePlus size={28} /> : <UploadCloud size={28} />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">
              {file ? "Đổi ảnh tìm kiếm" : "Upload hoặc Chụp ảnh sản phẩm"}
            </h3>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Đây là giao diện mock AI visual search. Hãy tải ảnh lên hoặc bật webcam để chụp trực tiếp.
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            {/* Nút 1: Chọn file */}
            <label className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 shadow-sm">
              <UploadCloud size={18} />
              <span>Chọn ảnh từ máy</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onChange(event.target.files?.[0])}
              />
            </label>

            {/* Nút 2: Bật Camera UI */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Camera size={18} />
              <span>Mở Camera</span>
            </button>
          </div>
        </div>
      )}

      {/* PHẦN HIỂN THỊ KẾT QUẢ (Preview) */}
      {previewUrl && !isCameraOpen ? (
        <div className="border-t border-slate-200 p-6 bg-slate-50/50">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-56 w-full rounded-2xl object-cover shadow-sm border border-slate-200"
            />
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-slate-900">
                Ảnh đã chọn: {file?.name || "Ảnh chụp từ Camera"}
              </h4>
              <p className="text-sm leading-6 text-slate-500">
                Hệ thống sẽ tiến hành trích xuất đặc trưng hình ảnh và tìm kiếm các sản phẩm tương đồng trong cơ sở dữ liệu.
              </p>
              <button
                className="mt-2 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                onClick={onClear}
              >
                Xoá ảnh hiện tại
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ImageUploader;