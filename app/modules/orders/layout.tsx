// modules/carts/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membuat Pesanan - BossHype Store",
  description: "Membuat pesanan Anda di BossHype Store",
};

export default function OrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}