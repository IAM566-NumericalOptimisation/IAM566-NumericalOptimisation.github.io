import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" style={{ paddingTop: "3.4rem" }}>
      <h1 style={{ fontWeight: 500, letterSpacing: "-0.03em" }}>Not found</h1>
      <p>
        <Link href="/">Lecture notes</Link>
      </p>
    </main>
  );
}
