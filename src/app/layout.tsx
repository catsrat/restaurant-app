import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Order QR | OQ Ordering & QR Ordering Software",
    template: "%s | Order QR"
  },
  description: "The best QR ordering software for restaurants. Order QR (OQ Ordering) offers digital menus, table ordering, KDS, and POS printing in one simple platform.",
  keywords: ["restaurant management system", "qr code menu", "digital menu", "kitchen display system", "KDS", "restaurant pos", "order qr", "table ordering system", "oq ordering", "qr ordering software", "online ordering system"],
  authors: [{ name: "Order QR Team" }],
  creator: "Order QR",
  publisher: "Order QR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Order QR | OQ Ordering & QR Ordering Software",
    description: "Streamline your restaurant with Order QR - the top-rated QR ordering software and OQ ordering system.",
    url: "https://www.orderqr.in",
    siteName: "Order QR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Order QR | OQ Ordering & QR Ordering Software",
    description: "Streamline your restaurant with Order QR - the top-rated QR ordering software and OQ ordering system.",
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
