import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

export type NoteStatus = "published" | "forthcoming";

export type Note = {
  slug: string;
  title: string;
  code: string;
  order: number;
  status: NoteStatus;
  pdf?: string;
  content: string;
};

export type Heading = { id: string; text: string };

const dir = path.join(process.cwd(), "content", "notes");

export function getNotes(): Note[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: String(data.title ?? slug),
        code: String(data.code ?? ""),
        order: Number(data.order ?? 0),
        status: data.status === "forthcoming" ? "forthcoming" : "published",
        pdf: data.pdf ? String(data.pdf) : undefined,
        content: content.trim(),
      } satisfies Note;
    })
    .sort((a, b) => a.order - b.order);
}

export function getNote(slug: string): Note | null {
  return getNotes().find((note) => note.slug === slug) ?? null;
}

export function headingsOf(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const match of markdown.matchAll(/^##\s+(.+)$/gm)) {
    const text = match[1].trim();
    headings.push({ text, id: slugger.slug(text) });
  }
  return headings;
}

export type Block = { kind: "text"; markdown: string } | { kind: "figure"; name: string };
export type Section = { id: string; title: string; blocks: Block[]; figures: string[] };

/**
 * Splits a chapter into its introduction (the text before the first ##) and its
 * sections. Within a section, a figure marker ([[Name]] on a line of its own)
 * splits the text, so the figure appears exactly where the note puts it.
 */
export function sectionsOf(markdown: string): { intro: string; sections: Section[] } {
  const slugger = new GithubSlugger();
  const parts = markdown.split(/^##\s+(.+)$/m);
  const intro = parts[0].trim();
  const sections: Section[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const pieces = parts[i + 1].split(/^\[\[([A-Za-z]+)\]\]\s*$/m);
    const blocks: Block[] = [];
    const figures: string[] = [];
    pieces.forEach((piece, k) => {
      if (k % 2 === 1) {
        blocks.push({ kind: "figure", name: piece });
        figures.push(piece);
      } else if (piece.trim()) blocks.push({ kind: "text", markdown: piece.trim() });
    });
    sections.push({ id: slugger.slug(title), title, blocks, figures });
  }
  return { intro, sections };
}
