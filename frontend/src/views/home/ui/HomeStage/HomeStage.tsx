import type { Competition } from "@/shared/api";
import { FeaturedEvent } from "../FeaturedEvent";
import { UpcomingEvents } from "../UpcomingEvents";
import styles from "./HomeStage.module.css";

interface Props { events: Competition[]; slides: Competition[]; index: number; loading: boolean; onSelect: (index: number) => void; }

export function HomeStage({ events, slides, index, loading, onSelect }: Props) {
  const current = slides[index];
  const selectEvent = (id: number) => {
    const selected = slides.findIndex((event) => event.id === id);
    if (selected >= 0) onSelect(selected);
  };
  return <section className={styles.stage}>
    <div className={styles.inner}>
      <div className={styles.featureColumn}>
        <FeaturedEvent slides={slides} loading={loading} index={index} onSelect={onSelect} />
      </div>
      <UpcomingEvents events={events.slice(0, 5)} selectedId={current?.id} onSelect={selectEvent} />
    </div>
  </section>;
}
