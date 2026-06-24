import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "الأباصيري ستور - نظام الإدارة",
  description: "نظام إدارة متكامل للأباصيري ستور: بيع الهواتف والإكسسوارات وصيانة الأجهزة",
};

export const viewport: Viewport = {
  themeColor: "#07080f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster
          position="top-left"
          containerClassName="no-print"
          toastOptions={{
            duration: 2500,
            style: {
              direction: "rtl",
              fontFamily: "Tajawal, system-ui, sans-serif",
              borderRadius: "14px",
              padding: "12px 16px",
              fontWeight: 700,
              background: "#12131e",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            },
          }}
        />
      </body>
    </html>
  );
}
