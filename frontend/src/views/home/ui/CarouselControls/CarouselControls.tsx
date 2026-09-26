import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui";
import styles from "./CarouselControls.module.css";

interface Props { count: number; index: number; onSelect: (index: number) => void; }

export function CarouselControls({ count, index, onSelect }: Props) {
  if (count < 2) return null;
  return <div className={styles.controls}>
    <Button variant="outline" size="icon" aria-label="Предыдущее событие" onClick={() => onSelect((index - 1 + count) % count)}><ArrowLeft /></Button>
    <div className={styles.steps}>{Array.from({ length: count }, (_, step) => <Button key={step} variant="ghost" className={`${styles.step} ${step === index ? styles.active : ""}`} aria-label={`Событие ${step + 1}`} aria-pressed={step === index} onClick={() => onSelect(step)} />)}</div>
    <Button variant="outline" size="icon" aria-label="Следующее событие" onClick={() => onSelect((index + 1) % count)}><ArrowRight /></Button>
  </div>;
}
