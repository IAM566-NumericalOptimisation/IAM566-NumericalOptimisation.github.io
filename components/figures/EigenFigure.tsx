"use client";

import { useEffect, useRef, useState } from "react";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { COPPER, GREEN, INK, BLUE, arrow, axes, bindDrag, dot, mountPlane, near, rule, text } from "./plane";
import type { View } from "./plane";
import { pretty } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

const E1: Pair = [5, 2];
const E2: Pair = [1, 1];

function coords(x: number, y: number) {
  const c1 = (x - y) / 3;
  const c2 = (5 * y - 2 * x) / 3;
  return [c1, c2] as const;
}

export function EigenFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const [x, setX] = useState<Pair>([1, 0]);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stateRef = useRef({ x, k });
  stateRef.current = { x, k };
  const drawRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawRef.current();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const unbind = bindDrag(
      canvas,
      (px, py) => {
        const view = viewRef.current;
        const { x: p, k: step } = stateRef.current;
        if (!view) return null;
        if (step === 0) {
          const [c1, c2] = coords(p[0], p[1]);
          const sum: Pair = [c1 * E1[0] + c2 * E2[0], c1 * E1[1] + c2 * E2[1]];
          if (near(view, sum[0], sum[1], px, py, 18)) return "x";
        } else if (near(view, p[0], p[1], px, py, 18)) return "x";
        return null;
      },
      (_id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        setPlaying(false);
        setX([view.wx(px), view.wy(py)]);
      },
    );
    const stopTheme = watchTheme(draw);
    return () => {
      stopTheme();
      observer.disconnect();
      unbind();
    };
  }, []);

  useEffect(() => {
    drawRef.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x: p, k: step } = stateRef.current;
      const [c1, c2] = coords(p[0], p[1]);
      const s1 = c1 * 2 ** step;
      const s2 = c2 * (-1) ** step;
      const comp1: Pair = [s1 * E1[0], s1 * E1[1]];
      const comp2: Pair = [s2 * E2[0], s2 * E2[1]];
      const sum: Pair = [comp1[0] + comp2[0], comp1[1] + comp2[1]];
      const norm = Math.hypot(sum[0], sum[1]);
      const display = norm > 2.15 ? 2.15 / norm : 1;
      const view = mountPlane(canvas, 0, 0, 2.75);
      viewRef.current = view;
      if (!view) return;
      axes(view);
      rule(view, 0, 0, E1[0], E1[1], GREEN, 1.15);
      rule(view, 0, 0, E2[0], E2[1], COPPER, 1.15);
      const a: Pair = [comp1[0] * display, comp1[1] * display];
      const b: Pair = [a[0] + comp2[0] * display, a[1] + comp2[1] * display];
      arrow(view, 0, 0, a[0], a[1], GREEN, 2);
      arrow(view, a[0], a[1], b[0], b[1], COPPER, 2);
      arrow(view, 0, 0, b[0], b[1], INK, 1.5);
      if (step > 0) {
        arrow(view, 0, 0, p[0], p[1], BLUE, 1.4);
        dot(view, p[0], p[1], BLUE, 4);
        text(view, p[0], p[1], "x", BLUE);
      }
      dot(view, b[0], b[1], INK, 4);
      text(view, b[0], b[1], step === 0 ? "x" : "A^k x");
      text(view, 1.45, 0.62, "λ = 2", GREEN);
      text(view, 1.05, 1.15, "λ = −1", COPPER);
    };
    drawRef.current();
  }, [x, k]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setK((current) => (current >= 8 ? 0 : current + 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [playing]);

  const [c1, c2] = coords(x[0], x[1]);
  const s1 = c1 * 2 ** k;
  const s2 = c2 * (-1) ** k;
  const image: Pair = [s1 * 5 + s2, s1 * 2 + s2];
  const signed = (coeff: number, body: string) => {
    if (Math.abs(coeff) < 5e-4) return "";
    const piece = `${pretty(Math.abs(coeff))}${body}`;
    return coeff < 0 ? `-${piece}` : `+${piece}`;
  };
  const expression = `${signed(s1, "(5,2)")}${signed(s2, "(1,1)")}`.replace(/^\+/, "") || "0";
  const formula = `k=${k},\\quad [x]_B=(${pretty(c1)},${pretty(c2)}),\\quad A^{k}x=${expression}=(${pretty(image[0])},${pretty(image[1])})`;

  return (
    <figure className={styles.figure}>
      <canvas ref={canvasRef} className={`${styles.canvas} ${styles.plane}`} aria-label="Powers of the course matrix, split along its two eigenlines. Drag x." />
      <div className={styles.controls}>
        <label>
          k
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={k}
            aria-label="Power k"
            onChange={(event) => {
              setPlaying(false);
              setK(Number(event.target.value));
            }}
          />
        </label>
        <button type="button" className={styles.text} aria-pressed={playing} onClick={() => setPlaying((on) => !on)}>
          {playing ? "Stop" : "Apply A"}
        </button>
        <button
          type="button"
          className={styles.text}
          onClick={() => {
            setPlaying(false);
            setX([1, 0]);
            setK(0);
          }}
        >
          Notes
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag <Tex source="x" />. Green is the eigenvalue <Tex source="2" />, copper is <Tex source="-1" />. Each step multiplies those components by <Tex source="2" /> and by <Tex source="-1" />, so the copper piece flips and then shrinks beside the green one. From the notes&apos; <Tex source="(1,0)=\tfrac13(5,2)-\tfrac23(1,1)" />, the direction turns toward <Tex source="(5,2)" />. Once <Tex source="A^k x" /> leaves the window the arrow keeps that direction and the formula keeps the length.
      </figcaption>
    </figure>
  );
}
