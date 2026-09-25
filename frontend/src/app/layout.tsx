import type { Metadata } from "next";
import { Header } from "@/widgets/header";
import { QueryProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Арена · ФСП Республики Дагестан",
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
          <div className="site-shell">
            <Header />
            {children}
            <footer className="site-footer"><span>Арена ФСП РД · Внутренний рейтинг не заменяет официальные спортивные разряды.</span><span>Спорт. Люди. Развитие.</span></footer>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
