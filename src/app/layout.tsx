import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const fontSerif = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

const fontSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portfolio Studio — Thiết kế & Kiến trúc",
    template: "%s | Portfolio Studio",
  },
  description:
    "Portfolio kiến trúc với trình xem PDF & 3D tương tác. Trưng bày dự án, bản vẽ kỹ thuật và mô hình ba chiều.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Portfolio Studio",
    title: "Portfolio Studio — Thiết kế & Kiến trúc",
    description: "Portfolio kiến trúc với trình xem PDF & 3D tương tác.",
    images: [{ url: "/og-placeholder.svg", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontSerif.variable} ${fontSans.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NextIntlClientProvider messages={messages}>
            <a href="#main-content" className="skip-link">
              Chuyển đến nội dung chính
            </a>
            <Header />
            <main id="main-content" role="main" className="min-h-[80vh]">
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
