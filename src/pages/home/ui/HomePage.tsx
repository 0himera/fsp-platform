import * as React from "react";
import { HeroSection } from "./HeroSection";
import { AthleteSection } from "./AthleteSection";
import { AuthSection } from "./AuthSection";
import styles from "./HomePage.module.css";

export const HomePage: React.FC = () => {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <HeroSection />
        <div className={styles.grid}>
          <AthleteSection />
          <AuthSection />
        </div>
      </div>
    </main>
  );
};
