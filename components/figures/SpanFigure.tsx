"use client";

import { useEffect, useRef, useState } from "react";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { COPPER, GREEN, INK, arrow, axes, bindDrag, dot, mountPlane, near, rightAngle, rule, text } from "./plane";
import type { View } from "./plane";
import { fmt, pretty } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

const NOTES = { v1: [1, 0] as Pair, v2: [1, 1] as Pair, x: [5, 2] as Pair };

function solve(v1: Pair, v2: Pair, x: Pair) {
  const det = v1[0] * v2[1] - v1[1] * v2[0];
  const scale = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
  const independent = Math.abs(det) > Math.max(1e-3, 0.02 * scale);
  if (!independent) {
    const axis = Math.hypot(v1[0], v1[1]) >= Math.hypot(v2[0], v2[1]) ? v1 : v2;
    const n2 = axis[0] * axis[0] + axis[1] * axis[1];
    const coeff = n2 < 1e-8 ? 0 : (x[0] * axis[0] + x[1] * axis[1]) / n2;
    const proj: Pair = [coeff * axis[0], coeff * axis[1]];
    return { independent, det, alpha: 0, beta: 0, proj, dist: Math.hypot(x[0] - proj[0], x[1] - proj[1]) };
  }
  const alpha = (x[0] * v2[1] - x[1] * v2[0]) / det;
  const beta = (v1[0] * x[1] - v1[1] * x[0]) / det;
  return { independent, det, alpha, beta, proj: [0, 0] as Pair, dist: 0 };
}

export function SpanFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const [v1, setV1] = useState<Pair>(NOTES.v1);
  const [v2, setV2] = useState<Pair>(NOTES.v2);
  const [x, setX] = useState<Pair>(NOTES.x);
  const stateRef = useRef({ v1, v2, x });
  stateRef.current = { v1, v2, x };
  const drawRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawRef.current();
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const unbind = bindDrag(
      canvas,
      (px, py) => {
        const view = viewRef.current;
        const { v1: a, v2: b, x: p } = stateRef.current;
        if (!view) return null;
        if (near(view, p[0], p[1], px, py)) return "x";
        if (near(view, b[0], b[1], px, py)) return "v2";
        if (near(view, a[0], a[1], px, py)) return "v1";
        return null;
      },
      (id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        const next: Pair = [view.wx(px), view.wy(py)];
        if (id === "v1") setV1(next);
        else if (id === "v2") setV2(next);
        else setX(next);
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
      const { v1: a, v2: b, x: p } = stateRef.current;
      const solved = solve(a, b, p);
      const pts: Pair[] = [a, b, p];
      if (solved.independent) {
        pts.push([solved.alpha * a[0], solved.alpha * a[1]], [solved.beta * b[0], solved.beta * b[1]]);
      }
      let span = 3.4;
      for (const point of pts) span = Math.max(span, Math.abs(point[0]) / 0.7, Math.abs(point[1]) / 0.7);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const view = mountPlane(canvas, 0, 0, Math.min(span, 16));
      viewRef.current = view;
      if (!view) return;
      axes(view);
      if (!solved.independent) {
        const axis = Math.hypot(a[0], a[1]) >= Math.hypot(b[0], b[1]) ? a : b;
        if (Math.hypot(axis[0], axis[1]) > 1e-6) rule(view, 0, 0, axis[0], axis[1], GREEN, 1.15);
        arrow(view, 0, 0, solved.proj[0], solved.proj[1], GREEN, 1.7);
        arrow(view, solved.proj[0], solved.proj[1], p[0], p[1], COPPER, 1.7);
        if (solved.dist > 0.15 && Math.hypot(solved.proj[0], solved.proj[1]) > 0.15) {
          rightAngle(view, solved.proj[0], solved.proj[1], p[0] - solved.proj[0], p[1] - solved.proj[1], axis[0], axis[1]);
        }
      } else {
        const side: Pair = [solved.alpha * a[0], solved.alpha * a[1]];
        const tip: Pair = [side[0] + solved.beta * b[0], side[1] + solved.beta * b[1]];
        arrow(view, 0, 0, side[0], side[1], GREEN, 1.5);
        arrow(view, side[0], side[1], tip[0], tip[1], COPPER, 1.5);
      }
      arrow(view, 0, 0, a[0], a[1], GREEN, 2.3);
      arrow(view, 0, 0, b[0], b[1], COPPER, 2.3);
      arrow(view, 0, 0, p[0], p[1], INK, 1.6);
      dot(view, a[0], a[1], GREEN, 3.5);
      dot(view, b[0], b[1], COPPER, 3.5);
      dot(view, p[0], p[1], INK, 3.5);
      text(view, a[0], a[1], "v1", GREEN);
      text(view, b[0], b[1], "v2", COPPER);
      text(view, p[0], p[1], "x");
    };
    drawRef.current();
  }, [v1, v2, x]);

  const solved = solve(v1, v2, x);
  const formula = solved.independent
    ? `x = ${pretty(solved.alpha)}\\, v_1 + ${pretty(solved.beta)}\\, v_2,\\qquad \\det(v_1,v_2)=${fmt(solved.det)}`
    : `v_1 \\parallel v_2,\\qquad \\operatorname{dist}(x,\\operatorname{span})= ${fmt(solved.dist)}`;

  return (
    <figure className={styles.figure}>
      <canvas ref={canvasRef} className={`${styles.canvas} ${styles.plane}`} aria-label="Span of two vectors in the plane. Drag the tips." />
      <div className={styles.inline}>
        <button type="button" className={styles.text} onClick={() => { setV1(NOTES.v1); setV2(NOTES.v2); setX(NOTES.x); }}>
          Notes
        </button>
        <button
          type="button"
          className={styles.text}
          onClick={() => setV2([2 * v1[0], 2 * v1[1]])}
        >
          Parallel
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag the tips. The green and copper sides are the two weights, and they meet at <Tex source="x" /> exactly when the pair is a basis. The notes&apos; vectors give <Tex source="(5,2)=3v_1+2v_2" />. Set them parallel and <Tex source="x" /> falls off the line: a dependent pair spans less, which is why <Tex source="v_3=v_1+v_2" /> adds nothing.
      </figcaption>
    </figure>
  );
}
