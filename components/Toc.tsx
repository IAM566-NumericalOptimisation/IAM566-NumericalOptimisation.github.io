"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/notes";
import styles from "./Toc.module.css";

export function Toc({ items }: { items: Heading[] }) {
  const [current, setCurrent] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
  }, []);

  useEffect(() => {
    const mark = () => {
      let id = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) id = item.id;
      }
      setCurrent(id);
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    return () => window.removeEventListener("scroll", mark);
  }, [items]);

  return (
    <nav className={styles.nav} aria-label="Sections">
      <ol>
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={item.id === current ? "true" : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
