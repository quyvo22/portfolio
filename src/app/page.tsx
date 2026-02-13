import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects } from "@/data/mock";
import { ProjectCard } from "@/components/ui/project-card";
import { HeroSection } from "@/components/sections/hero-section";

export default function HomePage() {
  const featured = projects.slice(0, 4);

  return (
    <>
      <HeroSection />

      <section
        className="grid-container py-16"
        aria-labelledby="featured-heading"
      >
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 id="featured-heading" className="text-2xl md:text-3xl">
              Dự án nổi bật
            </h2>
            <p className="mt-1 text-ink-muted text-sm">
              Một số dự án tiêu biểu từ danh mục thiết kế
            </p>
          </div>
          <Link
            href="/portfolio"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline underline-offset-4"
          >
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href="/portfolio"
            className="flex items-center gap-1.5 text-sm font-medium text-accent-600 dark:text-accent-400"
          >
            Xem tất cả dự án <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
