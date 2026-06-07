// File: components/AssistantText.jsx
// Render nội dung AI trả về theo từng dòng, tự thêm icon theo ngữ cảnh như giá, mô tả, camera, pin...

import { formatAssistantMessage, getLineIcon } from "../utils/textUtils";

function AssistantText({ text = "" }) {
  const cleaned = formatAssistantMessage(text);
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const lower = line.toLowerCase();
        const isTitle =
          lower.includes("thông tin chi tiết") ||
          lower.includes("chi tiết sản phẩm") ||
          lower.includes("các biến thể hiện có") ||
          lower.includes("thong tin chi tiet") ||
          lower.includes("chi tiet san pham") ||
          lower.includes("cac bien the hien co");

        return (
          <div
            key={index}
            className={`flex items-start gap-2 ${
              isTitle ? "font-semibold text-slate-800" : "text-slate-700"
            }`}
          >
            <span className="mt-[2px] shrink-0">{getLineIcon(line)}</span>
            <span className="leading-6">{line.replace(/^•\s*/, "")}</span>
          </div>
        );
      })}
    </div>
  );
}

export default AssistantText;
