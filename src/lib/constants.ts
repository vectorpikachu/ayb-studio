export const siteConfig = {
  name: "Ayb",
  armenianName: "Այբ",
  description: "A quiet studio for learning Armenian.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const navItems = [
  { href: "/", label: "首页", match: "exact" },
  { href: "/dictionary", label: "词典", match: "prefix" },
  { href: "/review", label: "复习", match: "prefix" },
  { href: "/grammar", label: "语法", match: "prefix" },
  { href: "/write", label: "写作", match: "prefix" },
] as const;

export const mobileNav = [
  { href: "/", label: "首页", icon: "home", match: "exact" },
  { href: "/dictionary", label: "词典", icon: "book", match: "prefix" },
  { href: "/review", label: "复习", icon: "repeat", match: "prefix" },
  { href: "/grammar", label: "语法", icon: "blocks", match: "prefix" },
  { href: "/write", label: "写作", icon: "pen", match: "prefix" },
] as const;
