import Link from "next/link";
import { DescentField } from "@/components/DescentField";
import { getNotes } from "@/lib/notes";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function HomePage() {
  const notes = getNotes();

  return (
    <main id="content" className={styles.page}>
      <h1 className={styles.title}>Numerical Optimization</h1>
      <p className={styles.lede}>
        Lecture notes for IAM 566, Fall 2026, written from the <a href={site.notes}>course notes of Ali Ulvi Nohutçu</a>.
      </p>

      <figure className={styles.band}>
        <DescentField className={styles.field} />
        <figcaption>
          Gradient descent on (<i>x</i>² + <i>y</i> − 11)² + (<i>x</i> + <i>y</i>² − 7)², which has four minima.
        </figcaption>
      </figure>

      <h2 id="chapters" className={styles.head}>
        Chapters
      </h2>
      <ol className={styles.list}>
        {notes.map((note) =>
          note.status === "published" ? (
            <li key={note.slug}>
              <Link className={`${styles.row} ${styles.live}`} href={`/notes/${note.slug}/`}>
                <span className={styles.code}>{note.code}</span>
                <span className={styles.name}>{note.title}</span>
              </Link>
            </li>
          ) : (
            <li key={note.slug}>
              <span className={styles.row} aria-disabled="true">
                <span className={styles.code}>{note.code}</span>
                <span className={styles.name}>{note.title}</span>
                <span className={styles.soon}>in preparation</span>
              </span>
            </li>
          ),
        )}
      </ol>
    </main>
  );
}
