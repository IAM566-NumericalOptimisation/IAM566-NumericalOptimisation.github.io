import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.mark} aria-hidden="true" />
          IAM 566
          <span className={styles.course}>Numerical Optimization</span>
        </Link>
        <nav className={styles.tools} aria-label="Site">
          <Link className={styles.link} href="/#chapters">
            Chapters
          </Link>
          <a className={styles.link} href={site.repo}>
            Source
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
