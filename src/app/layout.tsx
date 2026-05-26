import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TRPCProdiver from "@/providers/TRPCProdiver";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda | E-commerce",
  description: "Compra online productos de distintas categorías con envío y pagos flexibles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`${geistSans.className} font-sans antialiased`}>
        <TRPCProdiver>
          {children}
        </TRPCProdiver>
        <Toaster />
      </body>
    </html>
  );
}
