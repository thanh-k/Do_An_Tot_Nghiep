export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });

export const filesToDataUrls = async (files = []) => {
  const validFiles = Array.from(files || []).filter(Boolean);
  return Promise.all(validFiles.map(fileToDataUrl));
};
