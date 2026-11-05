import Link from "next/link";
import { DescentField } from "@/components/DescentField";
import { getNotes, sectionsOf } from "@/lib/notes";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function HomePage() {
  const notes = getNotes();
  const first = notes.find((n) => n.status === "published");

  return (
    <main id="content">
      <section className={styles.hero}>
        <p className={styles.kicker}>IAM 566 · Fall 2026</p>
        <h1 className={styles.title}>Numerical Optimization</h1>
        <p className={styles.lede}>
          Lecture notes. <a href={site.notes}>Notes of Ali Ulvi Nohutçu</a>.
        </p>
        {first ? (
          <p className={styles.cta}>
            <Link href={`/notes/${first.slug}/`}>
              Begin with {first.title} <span aria-hidden="true">→</span>
            </Link>
          </p>
        ) : null}
      </section>

      <figure className={styles.band}>
        <DescentField className={styles.field} />
        <figcaption>
          Gradient descent on (<i>x</i>² + <i>y</i> − 11)² + (<i>x</i> + <i>y</i>² − 7)², which has four minima.
        </figcaption>
      </figure>

      <section aria-labelledby="chapters" className={styles.chapters}>
        <h2 id="chapters" className={styles.chaptersHead}>
          Chapters
        </h2>
        <ol className={styles.list}>
          {notes.map((note) => {
            const live = note.status === "published";
            const s = live ? sectionsOf(note.content) : null;
            return (
              <li key={note.slug}>
                <Link className={`${styles.row} ${live ? styles.live : ""}`} href={`/notes/${note.slug}/`}>
                  <span className={styles.code}>{note.code}</span>
                  <span className={styles.name}>{note.title}</span>
                  <span className={styles.status}>{live && s ? `${s.sections.length} sections` : "Soon"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
