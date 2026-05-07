import { useState, useEffect } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function AddressSelector({ onAddressChange }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");

  // 1. Tích hợp API Lấy danh sách Tỉnh/Thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(
          "https://provinces.open-api.vn/api/p/",
        );
        setProvinces(response.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách Tỉnh/Thành:", error);
        toast.error("Không thể tải danh sách Tỉnh/Thành phố");
      }
    };
    fetchProvinces();
  }, []);

  // 2. Lấy danh sách Quận/Huyện khi Tỉnh/Thành thay đổi
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(
            `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`,
          );
          setDistricts(response.data?.districts || []);
          setWards([]); // Reset phường xã
          setSelectedDistrict("");
          setSelectedWard("");
        } catch (error) {
          console.error("Lỗi lấy Quận/Huyện:", error);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  // 3. Lấy danh sách Phường/Xã khi Quận/Huyện thay đổi
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const response = await axios.get(
            `https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`,
          );
          setWards(response.data?.wards || []);
          setSelectedWard("");
        } catch (error) {
          console.error("Lỗi lấy Phường/Xã:", error);
        }
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // 4. Trigger callback truyền dữ liệu lên Component Cha (CheckoutPage) mỗi khi có thay đổi
  useEffect(() => {
    const provinceName =
      provinces.find((p) => p.code == selectedProvince)?.name || "";
    const districtName =
      districts.find((d) => d.code == selectedDistrict)?.name || "";
    const wardName = wards.find((w) => w.code == selectedWard)?.name || "";

    // Gọi hàm truyền từ props để cập nhật state ở CheckoutPage
    if (onAddressChange) {
      onAddressChange({
        province: provinceName,
        district: districtName,
        ward: wardName,
        specificAddress: specificAddress,
        fullAddress:
          `${specificAddress ? specificAddress + ", " : ""}${wardName ? wardName + ", " : ""}${districtName ? districtName + ", " : ""}${provinceName}`
            .trim()
            .replace(/,$/, ""),
      });
    }
  }, [
    selectedProvince,
    selectedDistrict,
    selectedWard,
    specificAddress,
    provinces,
    districts,
    wards,
    onAddressChange,
  ]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold flex items-center gap-2 text-slate-800">
          <MapPin size={20} className="text-brand-600" />
          Địa chỉ giao hàng
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chọn Tỉnh/Thành */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Tỉnh/Thành phố *
          </label>
          <select
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            required
            onInvalid={(e) =>
              e.target.setCustomValidity("Vui lòng chọn Tỉnh/Thành")
            }
            onInput={(e) => e.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chọn Quận/Huyện */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Quận/Huyện *
          </label>
          <select
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedProvince}
            required
            onInvalid={(e) =>
              e.target.setCustomValidity("Vui lòng chọn Quận/Huyện")
            }
            onInput={(e) => e.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Quận/Huyện --</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chọn Phường/Xã */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Phường/Xã *
          </label>
          <select
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            disabled={!selectedDistrict}
            required
            onInvalid={(e) =>
              e.target.setCustomValidity("Vui lòng chọn Phường/Xã")
            }
            onInput={(e) => e.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Phường/Xã --</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nhập Số nhà, tên đường chi tiết */}
      <div className="space-y-1 mt-4">
        <label className="text-xs font-medium text-slate-500">
          Số nhà, Tên đường (Chi tiết) *
        </label>
        <input
          type="text"
          className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          placeholder="VD: Số 123, Đường Lê Lợi..."
          value={specificAddress}
          onChange={(e) => setSpecificAddress(e.target.value)}
          required
          onInvalid={(e) =>
            e.target.setCustomValidity(
              "Vui lòng nhập Số nhà, Tên đường (Chi tiết)",
            )
          }
          onInput={(e) => e.target.setCustomValidity("")}
        />
      </div>
    </div>
  );
}
