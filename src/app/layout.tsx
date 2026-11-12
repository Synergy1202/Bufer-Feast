import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import GlobalNav from "@/components/GlobalNav";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/context/cart-context";
import { FloatingSupportButton } from "@/components/FloatingSupportButton";
import "./globals.css";

const dmSans = localFont({
  src: "../../public/assets/dm-sans.woff2",
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: {
    default: "Bufer Feast â€” Taste the Culture",
    template: "%s | Bufer Feast",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: false,
    follow: false,
  },
  description:
    "Authentic, home-style bulk meals. Ordered directly from verified kitchens.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();

  const pathname =
    headerStore.get("x-pathname") || "";

  const isVendorRoute =
    pathname === "/vendor" ||
    pathname.startsWith("/vendor/");

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isPortalRoute =
    isVendorRoute || isAdminRoute;

  return (
    <html
      lang="en"
      className={dmSans.variable}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-screen flex-col bg-[#0a0a0a] text-white antialiased">
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only absolute left-4 top-4 z-50 bg-[#FF5500] p-2 text-white focus:not-sr-only"
          >
            Skip to content
          </a>

          <GlobalNav />

          <main
            id="main-content"
            className="flex-grow"
          >
            {children}
          </main>

          {!isPortalRoute && <SiteFooter />}

          <FloatingSupportButton />
        </CartProvider>
      </body>
    </html>
  );
}
