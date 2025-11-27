import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Order QR | Restaurant Management System & Digital Menu",
    template: "%s | Order QR"
  },
  description: "The complete restaurant operating system. QR code menus, table ordering, kitchen display system (KDS), and POS printing. Boost your restaurant efficiency today.",
  keywords: ["restaurant management system", "qr code menu", "digital menu", "kitchen display system", "KDS", "restaurant pos", "order qr", "table ordering system"],
  authors: [{ name: "Order QR Team" }],
  creator: "Order QR",
  publisher: "Order QR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Order QR | Restaurant Management System",
    description: "Streamline your restaurant with our all-in-one QR ordering and management platform.",
    url: "https://www.orderqr.in",
    siteName: "Order QR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Order QR | Restaurant Management System",
    description: "Streamline your restaurant with our all-in-one QR ordering and management platform.",
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
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}
