import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href={site.repo}>
          IAM566
        </a>
        <div className={styles.tools}>
          <Link className={styles.notes} href="/">
            Lecture notes
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
