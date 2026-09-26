import React from "react";
import { SlideItem } from "./types";
import { SlideHeader } from "./SlideHeader";
import { SlidePoints } from "./SlidePoints";
import styles from "./SlideCard.module.css";

interface SlideCardProps {
  slide: SlideItem;
}

export const SlideCard: React.FC<SlideCardProps> = ({ slide }) => {
  return (
    <div className={styles.card}>
      <SlideHeader
        badge={slide.badge}
        title={slide.title}
        subtitle={slide.subtitle}
        highlights={slide.highlights}
      />
      <SlidePoints points={slide.points} actions={slide.actions} />
    </div>
  );
};
