import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function AddressSelector({ onAddressChange, compact = false }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");

  const lastFullAddressRef = useRef("");

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("https://provinces.open-api.vn/api/p/");
        setProvinces(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Lỗi lấy danh sách Tỉnh/Thành:", error);
        toast.error("Không thể tải danh sách Tỉnh/Thành phố");
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict("");
      setSelectedWard("");
      return;
    }

    const fetchDistricts = async () => {
      try {
        const response = await axios.get(
          `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`,
        );

        setDistricts(response.data?.districts || []);
        setWards([]);
        setSelectedDistrict("");
        setSelectedWard("");
      } catch (error) {
        console.error("Lỗi lấy Quận/Huyện:", error);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }

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
  }, [selectedDistrict]);

  useEffect(() => {
    const provinceName =
      provinces.find((p) => String(p.code) === String(selectedProvince))?.name ||
      "";

    const districtName =
      districts.find((d) => String(d.code) === String(selectedDistrict))?.name ||
      "";

    const wardName =
      wards.find((w) => String(w.code) === String(selectedWard))?.name || "";

    const fullAddress = `${specificAddress ? `${specificAddress}, ` : ""}${
      wardName ? `${wardName}, ` : ""
    }${districtName ? `${districtName}, ` : ""}${provinceName}`
      .trim()
      .replace(/,$/, "");

    if (lastFullAddressRef.current === fullAddress) {
      return;
    }

    lastFullAddressRef.current = fullAddress;

    if (onAddressChange) {
      onAddressChange({
        province: provinceName,
        district: districtName,
        ward: wardName,
        specificAddress,
        fullAddress,
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
  ]);

  return (
    <div
      className={`${
        compact ? "bg-slate-50 p-4" : "bg-white p-5"
      } relative space-y-4 rounded-2xl border border-slate-200 shadow-sm`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <MapPin size={20} className="text-brand-600" />
          Địa chỉ giao hàng
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Tỉnh/Thành phố *
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            value={selectedProvince}
            onChange={(event) => setSelectedProvince(event.target.value)}
            required
            onInvalid={(event) =>
              event.target.setCustomValidity("Vui lòng chọn Tỉnh/Thành")
            }
            onInput={(event) => event.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Quận/Huyện *
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
            value={selectedDistrict}
            onChange={(event) => setSelectedDistrict(event.target.value)}
            disabled={!selectedProvince}
            required
            onInvalid={(event) =>
              event.target.setCustomValidity("Vui lòng chọn Quận/Huyện")
            }
            onInput={(event) => event.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Quận/Huyện --</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            Phường/Xã *
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
            value={selectedWard}
            onChange={(event) => setSelectedWard(event.target.value)}
            disabled={!selectedDistrict}
            required
            onInvalid={(event) =>
              event.target.setCustomValidity("Vui lòng chọn Phường/Xã")
            }
            onInput={(event) => event.target.setCustomValidity("")}
          >
            <option value="">-- Chọn Phường/Xã --</option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <label className="text-xs font-medium text-slate-500">
          Số nhà, Tên đường chi tiết *
        </label>

        <input
          type="text"
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          placeholder="VD: Số 123, Đường Lê Lợi..."
          value={specificAddress}
          onChange={(event) => setSpecificAddress(event.target.value)}
          required
          onInvalid={(event) =>
            event.target.setCustomValidity(
              "Vui lòng nhập số nhà, tên đường chi tiết",
            )
          }
          onInput={(event) => event.target.setCustomValidity("")}
        />
      </div>
    </div>
  );
}