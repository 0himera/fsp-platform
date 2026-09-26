"use client";

import * as React from "react";
import { useMeQuery } from "@/entities/user";
import { HeaderBrand } from "../HeaderBrand";
import { HeaderNav } from "../HeaderNav";
import { HeaderActions } from "../HeaderActions";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { data: me } = useMeQuery();
  const user = me?.user;
  const accountHref = user?.role === "organizer" ? "/admin" : user ? "/profile" : "/login";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderBrand />
        <HeaderNav profileHref={accountHref} />
        <HeaderActions me={me} accountHref={accountHref} />
      </div>
    </header>
  );
};
