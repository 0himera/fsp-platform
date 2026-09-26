import type { Metadata } from "next";
import { NotFoundView } from "@/views/not-found";

export const metadata: Metadata = {
  title: "404 — Страница не найдена · ФСП РД",
  description: "Запрашиваемая страница не найдена на портале Федерации спортивного программирования Республики Дагестан.",
};

export default function NotFound() {
  return <NotFoundView />;
}
