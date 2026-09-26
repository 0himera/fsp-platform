import type { Metadata } from "next";
import { Header } from "@/widgets/header";
import { AiAssistant } from "@/widgets/ai-assistant";
import { QueryProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ФСП Республики Дагестан",
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
            <footer className="site-footer"><span>ФСП Республики Дагестан · Внутренний рейтинг не заменяет официальные спортивные разряды.</span></footer>
            <AiAssistant />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
