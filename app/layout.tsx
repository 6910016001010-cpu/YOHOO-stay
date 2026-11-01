import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: {
    default: "YOHOO ว่างไหม — ที่พักบูทีคใจกลางธรรมชาติ",
    template: "%s · YOHOO ว่างไหม",
  },
  description:
    "YOHOO ว่างไหม ระบบจองห้องพักบูทีคโฮเทล ตรวจสอบห้องว่างแบบเรียลไทม์ จองง่าย ชำระเงินปลอดภัย พร้อมบริการดูแลตลอดการเข้าพัก",
  keywords: ["จองห้องพัก", "โรงแรม", "บูทีคโฮเทล", "YOHOO", "ที่พัก"],
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#123b2d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
