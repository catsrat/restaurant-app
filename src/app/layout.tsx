import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "QR Order System | Order QR - Digital Menu & Ordering Software",
    template: "%s | Order QR"
  },
  description: "QR order system for modern restaurants. Order QR offers seamless QR ordering, digital menus, kitchen display, and POS printing in one powerful platform.",
  keywords: ["qr order", "qr order system", "qr ordering", "order qr", "restaurant management system", "qr code menu", "digital menu", "kitchen display system", "KDS", "restaurant pos", "table ordering system", "qr ordering software", "online ordering system"],
  authors: [{ name: "Order QR Team" }],
  creator: "Order QR",
  publisher: "Order QR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "QR Order System | Order QR - Digital Menu & Ordering Software",
    description: "QR order system for modern restaurants. Streamline operations with digital menus, table ordering, and real-time kitchen display.",
    url: "https://www.orderqr.in",
    siteName: "Order QR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Order System | Order QR - Digital Menu & Ordering Software",
    description: "QR order system for modern restaurants. Streamline operations with digital menus, table ordering, and real-time kitchen display.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://www.orderqr.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <OfflineBanner />
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}
