import { Metadata } from "next";
import { PresentationView } from "./PresentationView";

export const metadata: Metadata = {
  title: "Презентация защиты · ФСП Республики Дагестан",
  description: "Интерактивная презентация проекта для защиты хакатона ФСП.",
};

export default function PresentationPage() {
  return <PresentationView />;
}
