"use client";

import Header from "@/components/widgets/Header/Header";
import Footer from "@/components/widgets/Footer/Footer";
import { CurrencyProvider } from "@/contexts/CurrencyContext/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext/CartContext";

export default function StoreLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </CurrencyProvider>
  );
}
