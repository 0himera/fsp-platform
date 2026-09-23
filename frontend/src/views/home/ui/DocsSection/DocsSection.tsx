"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { APP_CONFIG } from "@/shared/config";
import styles from "./DocsSection.module.css";

export const DocsSection: React.FC = () => {
  return (
    <section id="docs" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Документы и регламенты</h2>
        <p className={styles.description}>
          Официальные материалы Федерации спортивного программирования Республики Дагестан
        </p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Правила вида спорта</CardTitle>
            <CardDescription>
              Правила соревнований по спортивному программированию РФ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              Включает стандарты 5 дисциплин: алгоритмическое, продуктовое, информационная безопасность,
              робототехника и программирование БАС.
            </p>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Положение о рейтинге arena-2</CardTitle>
            <CardDescription>
              Внутренний регламент начисления баллов спортсменам Дагестана
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              Математическая модель прозрачного сравнения спортивных результатов, учитывающая уровень стартов,
              разряды и давность выступлений.
            </p>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Контакты Федерации</CardTitle>
            <CardDescription>{APP_CONFIG.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              По вопросам проведения турниров и подтверждения разрядов:{" "}
              <a href={`mailto:${APP_CONFIG.supportEmail}`} className={styles.link}>
                {APP_CONFIG.supportEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DocsSection;
