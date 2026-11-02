"use client";

import { useEffect, useRef, useState } from "react";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { COPPER, GREEN, INK, arc, arrow, axes, bindDrag, dot, mountPlane, near, rightAngle, rule, text } from "./plane";
import type { View } from "./plane";
import { fmt } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

const ACUTE = { u: [2, 1] as Pair, x: [3, 4] as Pair };
const OBTUSE = { u: [2, 1] as Pair, x: [-3, 1] as Pair };

function project(u: Pair, x: Pair) {
  const denom = u[0] * u[0] + u[1] * u[1];
  const coeff = denom < 1e-10 ? 0 : (x[0] * u[0] + x[1] * u[1]) / denom;
  const proj: Pair = [coeff * u[0], coeff * u[1]];
  const drop: Pair = [x[0] - proj[0], x[1] - proj[1]];
  const dot = drop[0] * u[0] + drop[1] * u[1];
  const nx = Math.hypot(x[0], x[1]);
  const nu = Math.hypot(u[0], u[1]);
  const cos = nx * nu < 1e-10 ? 0 : (x[0] * u[0] + x[1] * u[1]) / (nx * nu);
  return { coeff, proj, drop, dot, cos };
}

export function ProjectionFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const stateRef = useRef({ u: ACUTE.u, x: ACUTE.x });
  const [u, setU] = useState<Pair>(ACUTE.u);
  const [x, setX] = useState<Pair>(ACUTE.x);
  const [playing, setPlaying] = useState(false);
  stateRef.current = { u, x };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const { u: uu, x: xx } = stateRef.current;
      const reach = Math.max(5.2, Math.abs(uu[0]), Math.abs(uu[1]), Math.abs(xx[0]), Math.abs(xx[1]));
      const view = mountPlane(canvas, 0.2, 0.6, reach / 0.78);
      viewRef.current = view;
      if (!view) return;
      axes(view);
      const { proj, drop } = project(uu, xx);
      if (Math.hypot(uu[0], uu[1]) > 1e-6) rule(view, 0, 0, uu[0], uu[1], GREEN, 1.15);
      arrow(view, 0, 0, proj[0], proj[1], GREEN, 1.8);
      arrow(view, proj[0], proj[1], xx[0], xx[1], COPPER, 1.8);
      arrow(view, 0, 0, xx[0], xx[1], INK, 1.5);
      arrow(view, 0, 0, uu[0], uu[1], GREEN, 2.2);
      if (Math.hypot(drop[0], drop[1]) > 0.2 && Math.hypot(proj[0], proj[1]) > 0.2) {
        rightAngle(view, proj[0], proj[1], drop[0], drop[1], uu[0], uu[1]);
      }
      const angU = Math.atan2(uu[1], uu[0]);
      const angX = Math.atan2(xx[1], xx[0]);
      arc(view, angU, angX, 28, INK);
      dot(view, uu[0], uu[1], GREEN, 3.5);
      dot(view, xx[0], xx[1], INK, 3.5);
      text(view, uu[0], uu[1], "u", GREEN);
      text(view, xx[0], xx[1], "x");
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const unbind = bindDrag(
      canvas,
      (px, py) => {
        const view = viewRef.current;
        const { u: uu, x: xx } = stateRef.current;
        if (!view) return null;
        if (near(view, xx[0], xx[1], px, py)) return "x";
        if (near(view, uu[0], uu[1], px, py)) return "u";
        return null;
      },
      (id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        setPlaying(false);
        const next: Pair = [view.wx(px), view.wy(py)];
        if (id === "x") setX(next);
        else setU(next);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reach = Math.max(5.2, Math.abs(u[0]), Math.abs(u[1]), Math.abs(x[0]), Math.abs(x[1]));
    const view = mountPlane(canvas, 0.2, 0.6, reach / 0.78);
    viewRef.current = view;
    if (!view) return;
    axes(view);
    const { proj, drop } = project(u, x);
    if (Math.hypot(u[0], u[1]) > 1e-6) rule(view, 0, 0, u[0], u[1], GREEN, 1.15);
    arrow(view, 0, 0, proj[0], proj[1], GREEN, 1.8);
    arrow(view, proj[0], proj[1], x[0], x[1], COPPER, 1.8);
    arrow(view, 0, 0, x[0], x[1], INK, 1.5);
    arrow(view, 0, 0, u[0], u[1], GREEN, 2.2);
    if (Math.hypot(drop[0], drop[1]) > 0.2 && Math.hypot(proj[0], proj[1]) > 0.2) {
      rightAngle(view, proj[0], proj[1], drop[0], drop[1], u[0], u[1]);
    }
    arc(view, Math.atan2(u[1], u[0]), Math.atan2(x[1], x[0]), 28, INK);
    dot(view, u[0], u[1], GREEN, 3.5);
    dot(view, x[0], x[1], INK, 3.5);
    text(view, u[0], u[1], "u", GREEN);
    text(view, x[0], x[1], "x");
  }, [u, x]);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      const radius = 4.2;
      setX([Math.round(radius * Math.cos(t) * 100) / 100, Math.round(radius * Math.sin(t) * 100) / 100]);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const { coeff, proj, dot: remainder, cos } = project(u, x);
  const formula = `\\operatorname{proj}_u x = ${fmt(coeff)}\\, u = (${fmt(proj[0])},${fmt(proj[1])})\\qquad \\langle x-\\operatorname{proj}_u x,\\, u\\rangle = ${fmt(remainder)}\\qquad \\cos\\theta = ${fmt(cos)}`;

  return (
    <figure className={styles.figure}>
      <canvas ref={canvasRef} className={`${styles.canvas} ${styles.plane}`} aria-label="Orthogonal projection of a vector onto a line. Drag u or x." />
      <div className={styles.inline}>
        <button type="button" className={styles.text} onClick={() => { setPlaying(false); setU(ACUTE.u); setX(ACUTE.x); }}>
          Acute
        </button>
        <button type="button" className={styles.text} onClick={() => { setPlaying(false); setU(OBTUSE.u); setX(OBTUSE.x); }}>
          Obtuse
        </button>
        <button type="button" className={styles.text} aria-pressed={playing} onClick={() => setPlaying((on) => !on)}>
          {playing ? "Stop" : "Move x"}
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag <Tex source="u" /> or <Tex source="x" />. The green arrow is the shadow on the line, the copper arrow is what remains, and the corner is the right angle. Acute is the notes&apos; pair <Tex source="u=(2,1)" />, <Tex source="x=(3,4)" />, with shadow <Tex source="(4,2)" />. Obtuse is <Tex source="x=(-3,1)" />, with shadow <Tex source="(-2,-1)" />.
      </figcaption>
    </figure>
  );
}
