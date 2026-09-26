import React from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle } from "lucide-react";
import { SlidePoint, SlideAction } from "./types";
import styles from "./SlidePoints.module.css";

interface SlidePointsProps {
  points: SlidePoint[];
  actions?: SlideAction[];
}

export const SlidePoints: React.FC<SlidePointsProps> = ({ points, actions }) => {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {points.map((p, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <CheckCircle size={16} className={styles.icon} />
              <h4 className={styles.title}>{p.title}</h4>
            </div>
            <p className={styles.desc}>{p.desc}</p>
          </div>
        ))}
      </div>
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((act, idx) => (
            <Link key={idx} href={act.href} className={styles.actionBtn} target="_blank">
              <span>{act.label}</span>
              <ExternalLink size={14} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
