"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { APP_CONFIG } from "@/shared/config";
import styles from "./DocsSection.module.css";

const DOCS_ITEMS = [
  {
    title: "Правила вида спорта",
    desc: "Правила соревнований по спортивному программированию РФ",
    body: "Включает стандарты 5 дисциплин: алгоритмическое, продуктовое, ИБ, робототехника и БАС.",
  },
  {
    title: "Положение о рейтинге arena-2",
    desc: "Внутренний регламент начисления баллов спортсменам Дагестана",
    body: "Математическая модель прозрачного сравнения спортивных результатов и разрядов.",
  },
  {
    title: "Контакты Федерации",
    desc: APP_CONFIG.location,
    body: `По вопросам проведения турниров и подтверждения разрядов: ${APP_CONFIG.supportEmail}`,
  },
];

export const DocsSection: React.FC = () => (
  <section id="docs" className={styles.section}>
    <div className={styles.header}>
      <h2 className={styles.heading}>Документы и регламенты</h2>
      <p className={styles.description}>
        Официальные материалы Федерации спортивного программирования Республики Дагестан
      </p>
    </div>
    <div className={styles.grid}>
      {DOCS_ITEMS.map((item) => (
        <Card key={item.title} className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>{item.title}</CardTitle>
            <CardDescription>{item.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

export default DocsSection;
