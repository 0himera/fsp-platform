import * as React from "react";
import { HeroSection } from "../HeroSection";
import { AthleteSection } from "../AthleteSection";
import { AuthSection } from "../AuthSection";
import { CompetitionsSection } from "../CompetitionsSection";
import { RankingSection } from "../RankingSection";
import { DocsSection } from "../DocsSection";
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
        <CompetitionsSection />
        <RankingSection />
        <DocsSection />
      </div>
    </main>
  );
};

export default HomePage;


