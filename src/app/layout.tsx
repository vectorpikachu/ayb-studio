import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileDock } from "@/components/mobile-dock";
import { getCurrentUser } from "@/lib/server/auth";

const notoSans = localFont({
  src: "../../public/fonts/noto-sans-latin.woff2",
  variable: "--font-noto-sans",
  display: "swap",
  weight: "100 900",
  fallback: ["Noto Sans", "system-ui", "sans-serif"],
});

const armenianSans = localFont({
  src: "../../public/fonts/noto-sans-armenian-arm.woff2",
  variable: "--font-armenian",
  display: "swap",
  weight: "100 900",
  fallback: ["Noto Sans Armenian", "sans-serif"],
});

// Hovhannes Tumanian's hand, by Ruben Tarumian. Free for personal and
// commercial use; see public/fonts/LICENSE-TUMANIAN.txt.
const armenianHand = localFont({
  src: "../../public/fonts/hovhannes-tumanian.woff2",
  variable: "--font-handwriting",
  display: "swap",
  weight: "400",
  fallback: ["Noto Sans Armenian", "cursive"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Ayb · 亚美尼亚语学习室",
    template: "%s · Ayb",
  },
  description:
    "Ayb 是一间安静的亚美尼亚语学习室：四语词典、带例句的间隔重复、系统语法课与自由写作。从一个字母开始，抵达一个世界。",
  keywords: ["亚美尼亚语", "Armenian", "հայերեն", "language learning", "dictionary", "flashcards"],
  authors: [{ name: "Ayb Studio" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ayb",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Ayb · 亚美尼亚语学习室",
    description: "从一个字母开始，学会亚美尼亚语。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('ayb-theme');
    if (t !== 'light' && t !== 'dark') t = 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="zh-CN"
      data-theme="light"
      suppressHydrationWarning
      className={`${notoSans.variable} ${armenianSans.variable} ${armenianHand.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="ambient" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader user={user} />
          <main className="flex-1">{children}</main>
          <SiteFooter user={user} />
        </div>
        <MobileDock />
      </body>
    </html>
  );
}
