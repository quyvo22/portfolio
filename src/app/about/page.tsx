import type { Metadata } from "next";
import { Mail, MapPin, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Thông tin về studio, triết lý thiết kế và đội ngũ.",
};

export default function AboutPage() {
  return (
    <section className="grid-container py-16">
      <div className="grid-12">
        <div className="col-span-4 sm:col-span-8 lg:col-span-7">
          <h1>Giới thiệu</h1>
          <p className="mt-4 text-ink-muted text-lg leading-relaxed">
            Thông tin về studio, triết lý thiết kế và đội ngũ.
          </p>

          <div className="mt-10 space-y-6 text-ink leading-relaxed">
            <p>
              Portfolio Studio là một studio kiến trúc & thiết kế đặt tại TP.
              Hồ Chí Minh. Chúng tôi tập trung vào thiết kế bền vững, kết hợp
              vật liệu địa phương với ngôn ngữ kiến trúc đương đại.
            </p>
            <p>
              Với hơn 10 năm kinh nghiệm, chúng tôi đã hoàn thành nhiều dự án
              đa dạng từ nhà ở, biệt thự nghỉ dưỡng đến công trình công cộng
              và cao ốc văn phòng.
            </p>
            <p>
              Website này được xây dựng như một portfolio tương tác, cho phép
              bạn xem bản vẽ PDF chi tiết và khám phá mô hình 3D trực tiếp
              trên trình duyệt.
            </p>
          </div>
        </div>

        <aside className="col-span-4 sm:col-span-8 lg:col-span-4 lg:col-start-9">
          <div className="card p-6 mt-8 lg:mt-0">
            <h3 className="text-lg mb-5">Thông tin liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail
                  size={16}
                  className="mt-0.5 text-accent-500 shrink-0"
                />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-ink-muted">hello@portfolio.studio</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin
                  size={16}
                  className="mt-0.5 text-accent-500 shrink-0"
                />
                <div>
                  <p className="font-medium">Địa chỉ</p>
                  <p className="text-ink-muted">
                    Quận 1, TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Briefcase
                  size={16}
                  className="mt-0.5 text-accent-500 shrink-0"
                />
                <div>
                  <p className="font-medium">Lĩnh vực</p>
                  <p className="text-ink-muted">
                    Kiến trúc, Nội thất, Quy hoạch
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
