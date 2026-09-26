"use client";

import React from "react";
import { allSlides } from "./slides";
import { usePresentation } from "./usePresentation";
import { PresentationHeader } from "./PresentationHeader";
import { SlideCard } from "./SlideCard";
import { SlideNav } from "./SlideNav";
import styles from "./PresentationView.module.css";

export const PresentationView: React.FC = () => {
  const {
    currentIndex,
    next,
    prev,
    goTo,
    isFullscreen,
    toggleFullscreen,
  } = usePresentation(allSlides.length);

  const currentSlide = allSlides[currentIndex];

  return (
    <div className={`${styles.wrapper} ${isFullscreen ? styles.fullscreen : ""}`}>
      <div className={styles.inner}>
        <PresentationHeader />
        <main className={styles.main}>
          <SlideCard slide={currentSlide} />
        </main>
        <footer className={styles.footer}>
          <SlideNav
            currentIndex={currentIndex}
            totalSlides={allSlides.length}
            onPrev={prev}
            onNext={next}
            onSelect={goTo}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </footer>
      </div>
    </div>
  );
};
