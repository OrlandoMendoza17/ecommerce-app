import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TRPCProdiver from "@/providers/TRPCProdiver";
import { AuthProvider } from "@/contexts/AuthContext/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { getStoreSeoSettings } from "@/lib/store-settings.server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStoreSeoSettings();

  const title = s.metaTitle;
  const description = s.metaDescription;

  return {
    title: {
      default: title,
      template: `%s | ${s.siteName}`,
    },
    description,
    robots: {
      index: s.robotsIndex,
      follow: s.robotsIndex,
    },
    openGraph: {
      title,
      description,
      siteName: s.siteName,
      locale: s.defaultLocale.replace("-", "_"),
      type: "website",
      ...(s.ogImageUrl ? { images: [{ url: s.ogImageUrl }] } : {}),
    },
    ...(s.canonicalBaseUrl
      ? { metadataBase: new URL(s.canonicalBaseUrl) }
      : {}),
    ...(s.faviconUrl ? { icons: { icon: s.faviconUrl } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { defaultLocale } = await getStoreSeoSettings();

  return (
    <html
      lang={defaultLocale}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`${geistSans.className} font-sans antialiased`}>
        <TRPCProdiver>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TRPCProdiver>
        <Toaster />
      </body>
    </html>
  );
}
