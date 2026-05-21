import { Geist, Geist_Mono } from "next/font/google";
import { AdminPanel } from "@/components/pages/admin/AdminPanel/AdminPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout de /admin: carga solo Geist + Geist Mono.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} font-theme-admin font-sans antialiased min-h-screen`}
    >
      <AdminPanel page="" searchPlaceholder="Busca un usuario...">
        {children}
      </AdminPanel>
    </div>
  );
}
