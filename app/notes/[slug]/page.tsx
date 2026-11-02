import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteBody } from "@/components/NoteBody";
import { Toc } from "@/components/Toc";
import { getNote, getNotes, headingsOf } from "@/lib/notes";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};
  return { title: `${note.code} ${note.title}` };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  if (note.status === "forthcoming") {
    return (
      <main className={styles.soon} id="content">
        <p className={styles.code}>{note.code}</p>
        <h1 className={styles.title}>{note.title}</h1>
        <NoteBody content={note.content} />
        <p className={styles.back}>
          <Link href="/">← Back</Link>
        </p>
      </main>
    );
  }

  const headings = headingsOf(note.content);

  return (
    <div className={styles.layout}>
      <aside className={styles.side}>
        <p className={styles.code}>{note.code}</p>
        <Toc items={headings} />
      </aside>
      <main id="content">
        <header>
          <h1 className={styles.title}>{note.title}</h1>
          {note.pdf ? (
            <p className={styles.pdf}>
              <a href={note.pdf} target="_blank" rel="noreferrer">Full notes</a>
            </p>
          ) : null}
        </header>
        <NoteBody content={note.content} />
        <p className={styles.back}>
          <Link href="/">← Back</Link>
        </p>
      </main>
    </div>
  );
}
