const variant = ({
  id,
  sku,
  attributes,
  price,
  compareAtPrice,
  stock,
  images,
}) => ({
  id,
  sku,
  attributes,
  price,
  compareAtPrice,
  stock,
  images,
});

export const products = [
  {
    id: "prod-iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    shortDescription:
      "Flagship Apple với chip A17 Pro, camera 48MP và khung titan cao cấp.",
    description:
      "iPhone 15 Pro Max mang đến trải nghiệm flagship trọn vẹn với hiệu năng mạnh mẽ, camera zoom quang học chất lượng, màn hình Super Retina XDR siêu sáng và thiết kế titan sang trọng. Phù hợp cho người dùng yêu thích hệ sinh thái Apple và hiệu năng bền bỉ lâu dài.",
    categoryId: "cat-phone",
    brand: "Apple",
    rating: 4.9,
    reviewCount: 438,
    thumbnail:
      "https://images.unsplash.com/photo-1695048133142-1a20484ef9f4?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484ef9f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1695636427783-10aa32f95d89?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1695636427926-cf2b22db3f4b?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      "Màn hình": "6.7-inch Super Retina XDR OLED",
      Chip: "Apple A17 Pro",
      Camera: "48MP + 12MP + 12MP",
      Pin: "4441mAh",
      "Kết nối": "USB-C, Wi-Fi 6E, 5G",
    },
    isFeatured: true,
    isNew: true,
    isSale: true,
    createdAt: "2026-01-12T09:00:00.000Z",
    variants: [
      variant({
        id: "var-iphone-black-256",
        sku: "IP15PM-BLK-256",
        attributes: { color: "Titan Đen", storage: "256GB" },
        price: 28990000,
        compareAtPrice: 30990000,
        stock: 8,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484ef9f4?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1695636427926-cf2b22db3f4b?auto=format&fit=crop&w=1200&q=80",
        ],
      }),
      variant({
        id: "var-iphone-blue-512",
        sku: "IP15PM-BLU-512",
        attributes: { color: "Titan Xanh", storage: "512GB" },
        price: 32990000,
        compareAtPrice: 34990000,
        stock: 6,
        images: [
          "https://images.unsplash.com/photo-1695636427783-10aa32f95d89?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1695636427926-cf2b22db3f4b?auto=format&fit=crop&w=1200&q=80",
        ],
      }),
      variant({
        id: "var-iphone-natural-1tb",
        sku: "IP15PM-NAT-1TB",
        attributes: { color: "Titan Tự Nhiên", storage: "1TB" },
        price: 37990000,
        compareAtPrice: 39990000,
        stock: 4,
        images: [
          "https://images.unsplash.com/photo-1695636427926-cf2b22db3f4b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1695048133142-1a20484ef9f4?auto=format&fit=crop&w=1200&q=80",
        ],
      }),
    ],
  },
  {
    id: "prod-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    shortDescription:
      "Galaxy AI mạnh mẽ, bút S Pen tiện dụng và camera zoom ấn tượng.",
    description:
      "Galaxy S24 Ultra là lựa chọn hàng đầu cho người dùng Android cao cấp với camera 200MP, hiệu năng mạnh mẽ, khung titan bền bỉ và các tính năng Galaxy AI hỗ trợ làm việc, dịch thuật và xử lý hình ảnh.",
    categoryId: "cat-phone",
    brand: "Samsung",
    rating: 4.8,
    reviewCount: 312,
    thumbnail:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      "Màn hình": "6.8-inch Dynamic AMOLED 2X",
      Chip: "Snapdragon 8 Gen 3 for Galaxy",
      Camera: "200MP + 50MP + 12MP + 10MP",
      Pin: "5000mAh",
      "Kết nối": "Wi-Fi 7, 5G, USB-C",
    },
    isFeatured: true,
    isNew: true,
    isSale: false,
    createdAt: "2026-01-08T09:00:00.000Z",
    variants: [
      variant({
        id: "var-s24-gray-256",
        sku: "S24U-GRY-256",
        attributes: { color: "Titan Xám", storage: "256GB" },
        price: 27990000,
        compareAtPrice: 29990000,
        stock: 10,
        images: [
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-s24-black-512",
        sku: "S24U-BLK-512",
        attributes: { color: "Titan Đen", storage: "512GB" },
        price: 30990000,
        compareAtPrice: 32990000,
        stock: 7,
        images: [
          "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-s24-violet-1tb",
        sku: "S24U-VIO-1TB",
        attributes: { color: "Titan Tím", storage: "1TB" },
        price: 34990000,
        compareAtPrice: 36990000,
        stock: 3,
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-xiaomi-14",
    name: "Xiaomi 14",
    slug: "xiaomi-14",
    shortDescription:
      "Flagship nhỏ gọn với Leica camera, Snapdragon 8 Gen 3 và sạc nhanh.",
    description:
      "Xiaomi 14 dành cho người dùng yêu thích smartphone nhỏ gọn nhưng vẫn cần hiệu năng flagship. Máy có màn hình LTPO sáng đẹp, sạc nhanh, camera Leica và pin đủ dùng cho cả ngày.",
    categoryId: "cat-phone",
    brand: "Xiaomi",
    rating: 4.6,
    reviewCount: 146,
    thumbnail:
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      "Màn hình": "6.36-inch LTPO AMOLED",
      Chip: "Snapdragon 8 Gen 3",
      Camera: "50MP Leica Summilux",
      Pin: "4610mAh",
      "Sạc": "90W wired, 50W wireless",
    },
    isFeatured: false,
    isNew: true,
    isSale: true,
    createdAt: "2026-02-03T09:00:00.000Z",
    variants: [
      variant({
        id: "var-mi14-black-256",
        sku: "MI14-BLK-256",
        attributes: { color: "Đen", storage: "256GB" },
        price: 18990000,
        compareAtPrice: 20990000,
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-mi14-white-512",
        sku: "MI14-WHT-512",
        attributes: { color: "Trắng", storage: "512GB" },
        price: 20990000,
        compareAtPrice: 22990000,
        stock: 9,
        images: [
          "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-macbook-air-m3",
    name: "MacBook Air M3 13 inch",
    slug: "macbook-air-m3-13-inch",
    shortDescription:
      "Ultrabook siêu nhẹ với Apple M3, pin bền bỉ và màn hình Liquid Retina.",
    description:
      "MacBook Air M3 là laptop dành cho người dùng sáng tạo, văn phòng hiện đại và học tập chuyên nghiệp. Máy mỏng nhẹ, pin dài, hiệu năng mạnh mẽ và vận hành cực kỳ êm ái.",
    categoryId: "cat-laptop",
    brand: "Apple",
    rating: 4.9,
    reviewCount: 256,
    thumbnail:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      CPU: "Apple M3 8-core",
      GPU: "10-core GPU",
      "Màn hình": "13.6-inch Liquid Retina",
      Pin: "lên đến 18 giờ",
      "Trọng lượng": "1.24kg",
    },
    isFeatured: true,
    isNew: true,
    isSale: true,
    createdAt: "2026-01-20T09:00:00.000Z",
    variants: [
      variant({
        id: "var-mba-silver-16-512",
        sku: "MBA13-SLV-16-512",
        attributes: { color: "Bạc", ram: "16GB", ssd: "512GB" },
        price: 31990000,
        compareAtPrice: 34990000,
        stock: 8,
        images: [
          "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-mba-midnight-16-1tb",
        sku: "MBA13-MID-16-1TB",
        attributes: { color: "Midnight", ram: "16GB", ssd: "1TB" },
        price: 37990000,
        compareAtPrice: 39990000,
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-mba-starlight-24-1tb",
        sku: "MBA13-STR-24-1TB",
        attributes: { color: "Starlight", ram: "24GB", ssd: "1TB" },
        price: 43990000,
        compareAtPrice: 45990000,
        stock: 2,
        images: [
          "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-dell-xps-13-plus",
    name: "Dell XPS 13 Plus",
    slug: "dell-xps-13-plus",
    shortDescription:
      "Laptop cao cấp cho công việc sáng tạo với màn hình sắc nét và thiết kế tinh giản.",
    description:
      "Dell XPS 13 Plus mang phong cách tối giản hiện đại, bàn phím edge-to-edge, trackpad ẩn và hiệu năng ổn định cho công việc văn phòng, lập trình và sáng tạo nội dung.",
    categoryId: "cat-laptop",
    brand: "Dell",
    rating: 4.7,
    reviewCount: 138,
    thumbnail:
      "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      CPU: "Intel Core Ultra 7",
      "Màn hình": "13.4-inch 3K OLED",
      RAM: "16GB / 32GB LPDDR5X",
      SSD: "512GB / 1TB",
      "Trọng lượng": "1.28kg",
    },
    isFeatured: true,
    isNew: false,
    isSale: false,
    createdAt: "2025-12-10T09:00:00.000Z",
    variants: [
      variant({
        id: "var-xps-platinum-16-512",
        sku: "XPS13-PLT-16-512",
        attributes: { color: "Bạch Kim", ram: "16GB", ssd: "512GB" },
        price: 36990000,
        compareAtPrice: 38990000,
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-xps-graphite-32-1tb",
        sku: "XPS13-GRA-32-1TB",
        attributes: { color: "Graphite", ram: "32GB", ssd: "1TB" },
        price: 45990000,
        compareAtPrice: 48990000,
        stock: 3,
        images: [
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-rog-zephyrus-g14",
    name: "ASUS ROG Zephyrus G14",
    slug: "asus-rog-zephyrus-g14",
    shortDescription:
      "Laptop gaming mỏng nhẹ với RTX mạnh mẽ, màn hình 165Hz và hiệu năng ấn tượng.",
    description:
      "ROG Zephyrus G14 phù hợp cho game thủ, nhà sáng tạo nội dung và người dùng cần hiệu năng cao trong thân máy di động. Thiết kế thời trang, pin tốt và phần cứng mạnh mẽ giúp máy cân bằng giữa làm việc và giải trí.",
    categoryId: "cat-laptop",
    brand: "ASUS",
    rating: 4.8,
    reviewCount: 187,
    thumbnail:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      CPU: "AMD Ryzen 9 8945HS",
      GPU: "RTX 4060 / 4070",
      "Màn hình": "14-inch OLED 165Hz",
      RAM: "16GB / 32GB",
      SSD: "1TB",
    },
    isFeatured: false,
    isNew: true,
    isSale: true,
    createdAt: "2026-02-10T09:00:00.000Z",
    variants: [
      variant({
        id: "var-g14-white-16-1tb",
        sku: "G14-WHT-16-1TB",
        attributes: { color: "Moonlight White", ram: "16GB", ssd: "1TB" },
        price: 42990000,
        compareAtPrice: 45990000,
        stock: 4,
        images: [
          "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-g14-gray-32-1tb",
        sku: "G14-GRY-32-1TB",
        attributes: { color: "Eclipse Gray", ram: "32GB", ssd: "1TB" },
        price: 49990000,
        compareAtPrice: 52990000,
        stock: 2,
        images: [
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-ipad-air-m2",
    name: "iPad Air M2",
    slug: "ipad-air-m2",
    shortDescription:
      "Tablet mạnh mẽ cho học tập và sáng tạo, hỗ trợ Apple Pencil Pro.",
    description:
      "iPad Air M2 mang lại hiệu năng vượt trội trong thân máy mỏng nhẹ, rất phù hợp cho thiết kế, ghi chú, giải trí và làm việc di động. Kết hợp hoàn hảo với Apple Pencil Pro và Magic Keyboard.",
    categoryId: "cat-tablet",
    brand: "Apple",
    rating: 4.8,
    reviewCount: 204,
    thumbnail:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      Chip: "Apple M2",
      "Màn hình": "11-inch Liquid Retina",
      Camera: "12MP Wide",
      Pin: "lên đến 10 giờ",
      "Kết nối": "Wi-Fi 6E, USB-C",
    },
    isFeatured: true,
    isNew: true,
    isSale: false,
    createdAt: "2026-01-30T09:00:00.000Z",
    variants: [
      variant({
        id: "var-ipad-blue-128",
        sku: "IPADAIR-BLU-128",
        attributes: { color: "Xanh", storage: "128GB" },
        price: 16990000,
        compareAtPrice: 17990000,
        stock: 11,
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-ipad-purple-256",
        sku: "IPADAIR-PRP-256",
        attributes: { color: "Tím", storage: "256GB" },
        price: 19990000,
        compareAtPrice: 20990000,
        stock: 7,
        images: [
          "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-galaxy-tab-s9",
    name: "Samsung Galaxy Tab S9",
    slug: "samsung-galaxy-tab-s9",
    shortDescription:
      "Tablet Android cao cấp, màn hình AMOLED và bút S Pen đi kèm.",
    description:
      "Galaxy Tab S9 sở hữu màn hình Dynamic AMOLED 2X sắc nét, hiệu năng mạnh mẽ, kháng nước IP68 và khả năng làm việc đa nhiệm tốt với Samsung DeX.",
    categoryId: "cat-tablet",
    brand: "Samsung",
    rating: 4.7,
    reviewCount: 132,
    thumbnail:
      "https://images.unsplash.com/photo-1589739900243-4b52cd9ddf76?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1589739900243-4b52cd9ddf76?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      Chip: "Snapdragon 8 Gen 2 for Galaxy",
      "Màn hình": "11-inch Dynamic AMOLED 2X",
      Pin: "8400mAh",
      "Kết nối": "Wi-Fi 6E",
      "Bút đi kèm": "S Pen",
    },
    isFeatured: false,
    isNew: false,
    isSale: true,
    createdAt: "2025-11-28T09:00:00.000Z",
    variants: [
      variant({
        id: "var-tabs9-gray-128",
        sku: "TABS9-GRY-128",
        attributes: { color: "Graphite", storage: "128GB" },
        price: 17990000,
        compareAtPrice: 19990000,
        stock: 9,
        images: [
          "https://images.unsplash.com/photo-1589739900243-4b52cd9ddf76?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-tabs9-beige-256",
        sku: "TABS9-BEI-256",
        attributes: { color: "Beige", storage: "256GB" },
        price: 20990000,
        compareAtPrice: 22990000,
        stock: 6,
        images: [
          "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-airpods-pro-2",
    name: "AirPods Pro 2 USB-C",
    slug: "airpods-pro-2-usb-c",
    shortDescription:
      "Tai nghe chống ồn chủ động, âm thanh không gian và kết nối mượt với Apple.",
    description:
      "AirPods Pro 2 mang đến chất âm cân bằng, chống ồn chủ động hiệu quả, xuyên âm tự nhiên và chip H2 tối ưu cho hệ sinh thái Apple.",
    categoryId: "cat-accessory",
    brand: "Apple",
    rating: 4.8,
    reviewCount: 522,
    thumbnail:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      Driver: "Custom high-excursion Apple driver",
      Pin: "lên đến 6 giờ / lần sạc",
      "Chống ồn": "ANC + Adaptive Audio",
      "Kết nối": "Bluetooth 5.3",
      "Kháng nước": "IP54",
    },
    isFeatured: true,
    isNew: false,
    isSale: true,
    createdAt: "2025-10-18T09:00:00.000Z",
    variants: [
      variant({
        id: "var-airpods-white-standard",
        sku: "APP2-WHT-STD",
        attributes: { color: "Trắng", storage: "Không áp dụng" },
        price: 5490000,
        compareAtPrice: 6290000,
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    shortDescription:
      "Headphone chống ồn hàng đầu, âm thanh giàu chi tiết và đeo cực êm.",
    description:
      "Sony WH-1000XM5 là lựa chọn tuyệt vời cho dân văn phòng, người hay di chuyển và người dùng yêu cầu chất lượng âm thanh cao. Tai nghe sở hữu ANC mạnh, micro gọi rõ và pin lên tới 30 giờ.",
    categoryId: "cat-accessory",
    brand: "Sony",
    rating: 4.8,
    reviewCount: 274,
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      Driver: "30mm",
      "Chống ồn": "Dual Processor ANC",
      Pin: "30 giờ",
      "Trọng lượng": "250g",
      "Kết nối": "Bluetooth 5.2, 3.5mm",
    },
    isFeatured: false,
    isNew: false,
    isSale: true,
    createdAt: "2025-09-20T09:00:00.000Z",
    variants: [
      variant({
        id: "var-xm5-black",
        sku: "XM5-BLK",
        attributes: { color: "Đen", storage: "Không áp dụng" },
        price: 7490000,
        compareAtPrice: 8990000,
        stock: 13,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-xm5-silver",
        sku: "XM5-SLV",
        attributes: { color: "Bạc", storage: "Không áp dụng" },
        price: 7690000,
        compareAtPrice: 8990000,
        stock: 9,
        images: [
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-logitech-mx-master-3s",
    name: "Logitech MX Master 3S",
    slug: "logitech-mx-master-3s",
    shortDescription:
      "Chuột không dây cao cấp cho designer, coder và dân văn phòng chuyên nghiệp.",
    description:
      "MX Master 3S nổi bật với cảm biến chính xác cao, cuộn siêu nhanh MagSpeed, nút bấm yên tĩnh và khả năng kết nối đa thiết bị. Đây là mẫu chuột công thái học cao cấp đáng cân nhắc.",
    categoryId: "cat-accessory",
    brand: "Logitech",
    rating: 4.9,
    reviewCount: 348,
    thumbnail:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      DPI: "8000 DPI",
      Pin: "70 ngày",
      "Kết nối": "Bluetooth, Logi Bolt",
      "Tương thích": "Windows, macOS, Linux",
      "Trọng lượng": "141g",
    },
    isFeatured: true,
    isNew: false,
    isSale: false,
    createdAt: "2025-11-05T09:00:00.000Z",
    variants: [
      variant({
        id: "var-mx3s-black",
        sku: "MX3S-BLK",
        attributes: { color: "Đen", storage: "Không áp dụng" },
        price: 2490000,
        compareAtPrice: 2690000,
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-mx3s-gray",
        sku: "MX3S-GRY",
        attributes: { color: "Xám", storage: "Không áp dụng" },
        price: 2590000,
        compareAtPrice: 2790000,
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-anker-737",
    name: "Anker 737 Power Bank",
    slug: "anker-737-power-bank",
    shortDescription:
      "Sạc dự phòng 24.000mAh, 140W PD, màn hình hiển thị thông minh.",
    description:
      "Anker 737 là mẫu pin dự phòng cao cấp hỗ trợ sạc nhanh laptop, tablet và điện thoại. Màn hình kỹ thuật số trực quan giúp theo dõi công suất và thời lượng pin dễ dàng.",
    categoryId: "cat-accessory",
    brand: "Anker",
    rating: 4.7,
    reviewCount: 123,
    thumbnail:
      "https://images.unsplash.com/photo-1609592806596-b43c1c839130?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1609592806596-b43c1c839130?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      "Dung lượng": "24.000mAh",
      "Công suất": "140W Power Delivery 3.1",
      "Cổng": "2x USB-C, 1x USB-A",
      "Màn hình": "LCD smart display",
      "Trọng lượng": "630g",
    },
    isFeatured: false,
    isNew: false,
    isSale: true,
    createdAt: "2025-10-02T09:00:00.000Z",
    variants: [
      variant({
        id: "var-anker737-black",
        sku: "ANK737-BLK",
        attributes: { color: "Đen", storage: "24.000mAh" },
        price: 3290000,
        compareAtPrice: 3790000,
        stock: 16,
        images: [
          "https://images.unsplash.com/photo-1609592806596-b43c1c839130?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
  {
    id: "prod-ipad-mini-7",
    name: "iPad mini 7",
    slug: "ipad-mini-7",
    shortDescription:
      "Máy tính bảng nhỏ gọn, tiện di chuyển, hỗ trợ Apple Pencil cho ghi chú nhanh.",
    description:
      "iPad mini là lựa chọn tuyệt vời cho người dùng thích thiết bị nhỏ gọn nhưng vẫn đủ mạnh cho đọc sách, ghi chú, phác thảo và giải trí đa phương tiện.",
    categoryId: "cat-tablet",
    brand: "Apple",
    rating: 4.6,
    reviewCount: 98,
    thumbnail:
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80"
    ],
    specifications: {
      Chip: "Apple A17",
      "Màn hình": "8.3-inch Liquid Retina",
      Camera: "12MP",
      Pin: "10 giờ",
      "Kết nối": "Wi-Fi 6E, USB-C",
    },
    isFeatured: false,
    isNew: true,
    isSale: false,
    createdAt: "2026-02-18T09:00:00.000Z",
    variants: [
      variant({
        id: "var-ipadmini-purple-128",
        sku: "IPADMINI-PRP-128",
        attributes: { color: "Tím", storage: "128GB" },
        price: 14990000,
        compareAtPrice: 15990000,
        stock: 8,
        images: [
          "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
      variant({
        id: "var-ipadmini-starlight-256",
        sku: "IPADMINI-STR-256",
        attributes: { color: "Starlight", storage: "256GB" },
        price: 17990000,
        compareAtPrice: 18990000,
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80"
        ],
      }),
    ],
  },
];
