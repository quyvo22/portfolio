export interface Project {
  slug: string;
  title: string;
  description: string;
  category: "pdf" | "3d" | "both";
  thumbnail: string;
  year: number;
  tags: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
}

export const projects: Project[] = [
  {
    slug: "demo-project",
    title: "Nhà phố hiện đại Thảo Điền",
    description:
      "Thiết kế nhà phố 3 tầng kết hợp không gian xanh, tối ưu ánh sáng tự nhiên và thông gió chéo.",
    category: "both",
    thumbnail: "/og-placeholder.svg",
    year: 2024,
    tags: ["Nhà ở", "Hiện đại", "Xanh"],
  },
  {
    slug: "villa-da-lat",
    title: "Biệt thự nghỉ dưỡng Đà Lạt",
    description:
      "Biệt thự giữa rừng thông, sử dụng vật liệu địa phương kết hợp kiến trúc đương đại.",
    category: "pdf",
    thumbnail: "/og-placeholder.svg",
    year: 2024,
    tags: ["Biệt thự", "Nghỉ dưỡng"],
  },
  {
    slug: "office-tower",
    title: "Tòa nhà văn phòng Quận 2",
    description:
      "Cao ốc văn phòng hạng A, mặt dựng double-skin façade tiết kiệm năng lượng.",
    category: "3d",
    thumbnail: "/og-placeholder.svg",
    year: 2023,
    tags: ["Văn phòng", "Cao tầng"],
  },
  {
    slug: "museum-concept",
    title: "Bảo tàng Nghệ thuật Đương đại",
    description:
      "Concept bảo tàng với không gian trưng bày linh hoạt, kết hợp ánh sáng tự nhiên từ giếng trời.",
    category: "both",
    thumbnail: "/og-placeholder.svg",
    year: 2023,
    tags: ["Công trình công cộng", "Concept"],
  },
  {
    slug: "cafe-saigon",
    title: "Quán cà phê Sài Gòn Xưa",
    description:
      "Cải tạo nhà cổ Sài Gòn thành không gian cà phê mang đậm dấu ấn kiến trúc Đông Dương.",
    category: "pdf",
    thumbnail: "/og-placeholder.svg",
    year: 2022,
    tags: ["Cải tạo", "F&B"],
  },
  {
    slug: "bridge-concept",
    title: "Cầu bộ hành công viên",
    description:
      "Thiết kế cầu bộ hành uốn lượn qua hồ nước, kết cấu thép nhẹ kết hợp gỗ tự nhiên.",
    category: "3d",
    thumbnail: "/og-placeholder.svg",
    year: 2022,
    tags: ["Hạ tầng", "Landscape"],
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "kien-truc-ben-vung",
    title: "Kiến trúc bền vững trong bối cảnh Việt Nam",
    excerpt:
      "Tìm hiểu cách áp dụng nguyên tắc thiết kế bền vững phù hợp khí hậu nhiệt đới và văn hóa địa phương.",
    date: "2024-12-15",
    readingTime: "8 phút",
    tags: ["Bền vững", "Kiến trúc xanh"],
  },
  {
    slug: "bim-workflow",
    title: "Quy trình BIM hiệu quả cho studio nhỏ",
    excerpt:
      "Chia sẻ kinh nghiệm triển khai BIM ở quy mô studio 5–10 người, tối ưu chi phí và thời gian.",
    date: "2024-11-20",
    readingTime: "6 phút",
    tags: ["BIM", "Workflow"],
  },
  {
    slug: "vat-lieu-dia-phuong",
    title: "Sử dụng vật liệu địa phương trong kiến trúc đương đại",
    excerpt:
      "Gạch không nung, tre, đá ong — kết hợp hài hòa vật liệu truyền thống với thẩm mỹ hiện đại.",
    date: "2024-10-08",
    readingTime: "10 phút",
    tags: ["Vật liệu", "Truyền thống"],
  },
];
