// modules/carts/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang Belanja - BossHype Store",
  description: "Kelola keranjang belanja Anda di BossHype Store",
};

export default function CartsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}