// 1. Định nghĩa các tuỳ chọn cho từng loại thuộc tính biến thể
export const ATTRIBUTE_OPTIONS = {
  color: {
    label: "Màu sắc",
    options: [
      "Đen",
      "Trắng",
      "Bạc",
      "Xám",
      "Vàng",
      "Xanh",
      "Đỏ",
      "Hồng",
      "Titan",
      "Tím",
    ],
  },
  ram: {
    label: "RAM",
    options: ["4GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
  },
  storage: {
    label: "Dung lượng (ROM)",
    options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  },
  ssd: {
    label: "Ổ cứng SSD",
    options: ["128GB", "256GB", "512GB", "1TB", "2TB"],
  },
  screenSize: {
    label: "Kích thước màn hình",
    options: [
      "13.3 inch",
      "14 inch",
      "15.6 inch",
      "16 inch",
      "24 inch",
      "27 inch",
      "32 inch",
    ],
  },
  resolution: {
    label: "Độ phân giải",
    options: ["HD", "FHD", "2K", "4K", "8K"],
  },
  connection: {
    label: "Kiểu kết nối",
    options: ["Có dây", "Bluetooth", "Wireless 2.4GHz", "Type-C"],
  },
  power: {
    label: "Công suất",
    options: ["5W", "10W", "15W", "20W", "50W", "100W"],
  },
  size: {
    label: "Kích thước/Size",
    options: [
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "40mm",
      "41mm",
      "44mm",
      "45mm",
      "49mm",
    ],
  },
  material: {
    label: "Chất liệu",
    options: ["Nhôm", "Thép", "Nhựa", "Da", "Silicon", "Titan", "Vải cotton"],
  },
  switchType: {
    label: "Loại Switch",
    options: ["Blue Switch", "Red Switch", "Brown Switch", "Linear", "Tactile"],
  },
  battery: {
    label: "Dung lượng Pin",
    options: ["5000mAh", "10000mAh", "20000mAh"],
  },
  washingCapacity: {
    label: "Khối lượng giặt",
    options: ["7kg", "8kg", "9kg", "10kg", "12kg"],
  },
  coolingCapacity: {
    label: "Công suất lạnh",
    options: ["1 HP", "1.5 HP", "2 HP", "2.5 HP"],
  },
  fridgeCapacity: {
    label: "Dung tích",
    options: ["150L", "200L", "300L", "500L"],
  },
};

// 2. Map 20 danh mục nổi trội với các thuộc tính tương ứng (Dựa theo slug danh mục)
export const CATEGORY_VARIANT_CONFIG = {
  // Thiết bị công nghệ
  "dien-thoai": ["color", "storage", "ram"],
  laptop: ["color", "ram", "ssd"],
  macbook: ["color", "ram", "ssd"],
  "may-tinh-bang": ["color", "storage", "ram"],
  "dong-ho-thong-minh": ["color", "size", "material"],

  // Phụ kiện & Âm thanh
  "tai-nghe": ["color", "connection"],
  loa: ["color", "power", "connection"],
  "ban-phim": ["color", "switchType", "connection"],
  chuot: ["color", "connection"],
  "man-hinh": ["color", "screenSize", "resolution"],
  "may-anh": ["color", "resolution"],
  "sac-du-phong": ["battery", "color"],
  "op-lung": ["color", "material"],

  // Điện máy & Gia dụng
  tivi: ["screenSize", "resolution"],
  "tu-lanh": ["fridgeCapacity", "color"],
  "may-giat": ["washingCapacity", "color"],
  "dieu-hoa": ["coolingCapacity"],
  "quat-dieu-hoa": ["power", "color"],

  // Thời trang (Bonus theo TMĐT)
  "balo-tui-xach": ["color", "size", "material"],
  "quan-ao": ["size", "color"],
  "giay-dep": ["size", "color"],

  // Mặc định cho mọi danh mục không khớp
  default: ["color"],
};
