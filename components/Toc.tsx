"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Toc.module.css";

type Item = { id: string; text: string };

/** Section list with the current section marked and a line that fills as you read. */
export function Toc({ items }: { items: Item[] }) {
  const [current, setCurrent] = useState(0);
  const [fill, setFill] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  useEffect(() => {
    let raf = 0;
    const mark = () => {
      raf = 0;
      let idx = 0;
      items.forEach((item, i) => {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) idx = i;
      });
      setCurrent(idx);
      const links = listRef.current?.querySelectorAll("a");
      const link = links?.[idx];
      if (link) setFill(link.offsetTop + link.offsetHeight / 2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(mark);
    };
    mark();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <nav className={styles.nav} aria-label="Sections">
      <p>Contents</p>
      <div className={styles.track}>
        <span className={styles.progress} style={{ height: fill }} aria-hidden="true" />
        <ol ref={listRef}>
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={index === current ? "true" : undefined} data-read={index < current ? "true" : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.text}
            </a>
          </li>
        ))}
        </ol>
      </div>
    </nav>
  );
}
