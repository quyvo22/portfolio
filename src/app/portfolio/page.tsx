import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPublishedProjects } from "@/lib/data";
import { PortfolioFilter } from "@/components/ui/portfolio-filter";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("portfolio");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const projects = await getPublishedProjects();

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PortfolioFilter projects={projects} />
    </section>
  );
}
