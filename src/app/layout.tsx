import type { Metadata } from "next";
import { Header } from "@/widgets/header";
import { QueryProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Цифровая платформа ФСП РД | ТехноСпортФест – 2026",
  description:
    "Цифровая платформа Федерации спортивного программирования Республики Дагестан для спортсменов, соревнований и рейтинга.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>
          <Header />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
