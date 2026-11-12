import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FigureStage } from "@/components/FigureStage";
import { FIGURES } from "@/components/figures/registry";
import { Markdown } from "@/components/Markdown";
import { ReadingMotion } from "@/components/ReadingMotion";
import { Toc } from "@/components/Toc";
import { getNote, getNotes, sectionsOf } from "@/lib/notes";
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

  const notes = getNotes();
  const index = notes.findIndex((n) => n.slug === note.slug);
  const prev = notes[index - 1];
  const next = notes[index + 1];

  if (note.status === "forthcoming") {
    return (
      <main className={styles.soon} id="content">
        <p className={styles.code}>Chapter {note.code}</p>
        <h1 className={styles.title}>{note.title}</h1>
        <div className="prose">
          <Markdown source={note.content} />
        </div>
        <p className={styles.back}>
          <Link href="/">← All chapters</Link>
        </p>
      </main>
    );
  }

  const { intro, sections } = sectionsOf(note.content);
  let fig = 0;

  return (
    <>
      <ReadingMotion />
      <header className={styles.hero}>
        <p className={styles.code}>Chapter {note.code}</p>
        <h1 className={styles.title}>{note.title}</h1>
        {intro ? (
          <div className={`prose ${styles.intro}`}>
            <Markdown source={intro} />
          </div>
        ) : null}
        {note.pdf ? (
          <p className={styles.pdf}>
            <a href={note.pdf} target="_blank" rel="noreferrer">
              Full notes (PDF) <span aria-hidden="true">↗</span>
            </a>
          </p>
        ) : null}
      </header>

      <div className={styles.layout}>
        <aside className={styles.rail}>
          <Toc items={sections.map((s) => ({ id: s.id, text: s.title }))} />
        </aside>
        <main id="content" className={styles.sections}>
          {sections.map((s, i) => (
            <section key={s.id} className={styles.section} aria-labelledby={s.id}>
              <p className={styles.secnum} data-animate>
                § {String(i + 1).padStart(2, "0")}
              </p>
              <h2 id={s.id} className={styles.secTitle} data-animate>
                {s.title}
              </h2>
              {s.blocks.map((block, k) => {
                if (block.kind === "text") {
                  return (
                    <div key={k} className="prose">
                      <Markdown source={block.markdown} />
                    </div>
                  );
                }
                const entry = FIGURES[block.name];
                if (!entry) return null;
                fig += 1;
                return (
                  <div key={k} className={styles.figure} data-animate>
                    <FigureStage number={`${note.code}.${fig}`} title={entry.title}>
                      {entry.node}
                    </FigureStage>
                  </div>
                );
              })}
            </section>
          ))}

          <nav className={styles.pager} aria-label="Chapters">
            {prev ? (
              <Link href={`/notes/${prev.slug}/`}>
                <span>← Previous</span>
                {prev.code} {prev.title}
              </Link>
            ) : (
              <Link href="/">
                <span>←</span>
                All chapters
              </Link>
            )}
            {next ? (
              <Link href={`/notes/${next.slug}/`} className={styles.next}>
                <span>Next →</span>
                {next.code} {next.title}
              </Link>
            ) : null}
          </nav>
        </main>
      </div>
    </>
  );
}
