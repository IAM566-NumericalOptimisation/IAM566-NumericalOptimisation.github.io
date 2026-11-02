"use client";

import { useEffect, useRef, useState } from "react";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { COPPER, GREEN, INK, arrow, axes, bindDrag, dot, mountPlane, near, rule, text } from "./plane";
import type { View } from "./plane";
import { fmt } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

const DIRECTION: Pair = [1, -1];

function onSubspace(t: number): Pair {
  return [t * DIRECTION[0], t * DIRECTION[1]];
}

function onAffine(t: number): Pair {
  return [4 + t * DIRECTION[0], t * DIRECTION[1]];
}

function closest(point: Pair, affine: boolean) {
  const origin: Pair = affine ? [4, 0] : [0, 0];
  const dx = point[0] - origin[0];
  const dy = point[1] - origin[1];
  const t = (dx * DIRECTION[0] + dy * DIRECTION[1]) / 2;
  return affine ? onAffine(t) : onSubspace(t);
}

export function AffineFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const [affine, setAffine] = useState(true);
  const [p, setP] = useState<Pair>([4, 0]);
  const [q, setQ] = useState<Pair>([1, 3]);
  const stateRef = useRef({ affine, p, q });
  stateRef.current = { affine, p, q };
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
        const { p: a, q: b } = stateRef.current;
        if (!view) return null;
        if (near(view, b[0], b[1], px, py, 18)) return "q";
        if (near(view, a[0], a[1], px, py, 18)) return "p";
        return null;
      },
      (id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        const next = closest([view.wx(px), view.wy(py)], stateRef.current.affine);
        if (id === "p") setP(next);
        else setQ(next);
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
      const { p: a, q: b } = stateRef.current;
      const sum: Pair = [a[0] + b[0], a[1] + b[1]];
      let span = 5.4;
      for (const point of [a, b, sum, [4, 0] as Pair]) {
        span = Math.max(span, Math.abs(point[0]) / 0.72, Math.abs(point[1]) / 0.72);
      }
      const view = mountPlane(canvas, 0.4, 0.2, Math.min(span, 14));
      viewRef.current = view;
      if (!view) return;
      axes(view);
      rule(view, 0, 0, 1, -1, GREEN, 1.35);
      rule(view, 4, 0, 1, -1, COPPER, 1.35);
      dot(view, 0, 0, INK, 3);
      text(view, 0.15, 0.15, "0");
      arrow(view, 0, 0, sum[0], sum[1], INK, 1.7);
      dot(view, a[0], a[1], stateRef.current.affine ? COPPER : GREEN, 4.5);
      dot(view, b[0], b[1], stateRef.current.affine ? COPPER : GREEN, 4.5);
      dot(view, sum[0], sum[1], INK, 4);
      text(view, a[0], a[1], "p");
      text(view, b[0], b[1], "q");
      text(view, sum[0], sum[1], "p+q");
    };
    drawRef.current();
  }, [affine, p, q]);

  const sum: Pair = [p[0] + q[0], p[1] + q[1]];
  const onChosen = affine ? Math.abs(sum[0] + sum[1] - 4) < 1e-6 : Math.abs(sum[0] + sum[1]) < 1e-6;
  const formula = `p+q=(${fmt(sum[0])},${fmt(sum[1])}),\\qquad (p+q)_1+(p+q)_2=${fmt(sum[0] + sum[1])}`;

  return (
    <figure className={styles.figure}>
      <canvas ref={canvasRef} className={`${styles.canvas} ${styles.plane}`} aria-label="A line through the origin and the parallel line x1+x2=4. Drag the two points." />
      <div className={styles.inline}>
        <button
          type="button"
          className={styles.text}
          aria-pressed={!affine}
          onClick={() => {
            setAffine(false);
            setP(onSubspace(2));
            setQ(onSubspace(-1));
          }}
        >
          Subspace
        </button>
        <button
          type="button"
          className={styles.text}
          aria-pressed={affine}
          onClick={() => {
            setAffine(true);
            setP(onAffine(0));
            setQ(onAffine(-3));
          }}
        >
          x₁ + x₂ = 4
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag <Tex source="p" /> and <Tex source="q" />; they stay on the line you chose. Their sum {onChosen ? "lands on that line" : "leaves that line"}. It always stays on <Tex source="x_1+x_2=0" /> when both points do, and it always leaves <Tex source="x_1+x_2=4" />. The second line misses the origin, so it is the translate <Tex source="(4,0)+V" />, not a subspace.
      </figcaption>
    </figure>
  );
}
