import * as React from "react";
import { Button } from "@/shared/ui";
import { HeaderBrand } from "./HeaderBrand";
import { HeaderNav } from "./HeaderNav";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderBrand />
        <HeaderNav />
        <div className={styles.actions}>
          <Button variant="outline" size="sm">
            Личный кабинет
          </Button>
        </div>
      </div>
    </header>
  );
};
