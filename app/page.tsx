import Link from "next/link";
import { getNotes } from "@/lib/notes";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function HomePage() {
  const notes = getNotes();

  return (
    <main className={styles.main} id="content">
      <h1 className={styles.title}>Lecture notes</h1>
      <p className={styles.lede}>
        IAM 566, Numerical Optimization, Fall 2026. <a href={site.notes}>Notes of Ali Ulvi Nohutçu</a>.
      </p>
      <ol className={styles.list}>
        {notes.map((note) => (
          <li key={note.slug}>
            <Link className={styles.row} href={`/notes/${note.slug}/`}>
              <span className={styles.code}>{note.code}</span>
              <span className={styles.name}>{note.title}</span>
              {note.status === "forthcoming" ? <span className={styles.soon}>Coming soon</span> : <span />}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
