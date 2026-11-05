import type { ReactNode } from "react";
import styles from "./FigureStage.module.css";

/** A numbered title above a figure; the figure draws its own frame. */
export function FigureStage({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <p className={styles.head}>
        <span className={styles.num}>Figure {number}</span>
        <span className={styles.title}>{title}</span>
      </p>
      {children}
    </div>
  );
}
