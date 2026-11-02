"use client";

import { useEffect, useRef, useState } from "react";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import {
  COPPER,
  GREEN,
  INK,
  arc,
  arrow,
  axes,
  bindDrag,
  dot,
  mountGraph,
  mountPlane,
  near,
  path,
  rule,
  segment,
  text,
  tone,
} from "./plane";
import type { View } from "./plane";
import { fmt } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

function measure(v: Pair, w: Pair) {
  const ip = v[0] * w[0] + v[1] * w[1];
  const nv = Math.hypot(v[0], v[1]);
  const nw = Math.hypot(w[0], w[1]);
  const cos = nv * nw < 1e-10 ? 0 : ip / (nv * nw);
  const tStar = nw < 1e-8 ? 0 : ip / (nw * nw);
  const height = nv * nv - (nw < 1e-8 ? 0 : (ip * ip) / (nw * nw));
  return { ip, nv, nw, cos, tStar, height: Math.max(0, height) };
}

export function CauchyFigure() {
  const planeRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const [v, setV] = useState<Pair>([1, 2]);
  const [w, setW] = useState<Pair>([2, 1]);
  const stateRef = useRef({ v, w });
  stateRef.current = { v, w };
  const drawRef = useRef(() => {});

  useEffect(() => {
    const plane = planeRef.current;
    const graph = graphRef.current;
    if (!plane || !graph) return;
    const draw = () => drawRef.current();
    const observer = new ResizeObserver(draw);
    observer.observe(plane);
    observer.observe(graph);
    const unbind = bindDrag(
      plane,
      (px, py) => {
        const view = viewRef.current;
        const { v: vv, w: ww } = stateRef.current;
        if (!view) return null;
        if (near(view, vv[0], vv[1], px, py)) return "v";
        if (near(view, ww[0], ww[1], px, py)) return "w";
        return null;
      },
      (id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        const next: Pair = [view.wx(px), view.wy(py)];
        if (id === "v") setV(next);
        else setW(next);
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
      const plane = planeRef.current;
      const graph = graphRef.current;
      if (!plane || !graph) return;
      const { v: vv, w: ww } = stateRef.current;
      const { tStar, height, nv, nw } = measure(vv, ww);
      let span = 3.2;
      span = Math.max(span, Math.abs(vv[0]) / 0.7, Math.abs(vv[1]) / 0.7, Math.abs(ww[0]) / 0.7, Math.abs(ww[1]) / 0.7);
      const view = mountPlane(plane, 0, 0, Math.min(span, 12));
      viewRef.current = view;
      if (view) {
        axes(view);
        if (nw > 1e-6) rule(view, 0, 0, ww[0], ww[1], GREEN, 1.1);
        const proj: Pair = [tStar * ww[0], tStar * ww[1]];
        arrow(view, 0, 0, proj[0], proj[1], GREEN, 1.7);
        arrow(view, proj[0], proj[1], vv[0], vv[1], COPPER, 1.6);
        arrow(view, 0, 0, ww[0], ww[1], GREEN, 2.2);
        arrow(view, 0, 0, vv[0], vv[1], INK, 2.2);
        arc(view, Math.atan2(ww[1], ww[0]), Math.atan2(vv[1], vv[0]), 26, INK);
        dot(view, vv[0], vv[1], INK, 3.5);
        dot(view, ww[0], ww[1], GREEN, 3.5);
        text(view, vv[0], vv[1], "x");
        text(view, ww[0], ww[1], "y", GREEN);
      }
      const half = 1.8;
      const samples: Array<[number, number]> = [];
      let peak = height;
      for (let i = 0; i <= 80; i++) {
        const t = tStar - half + (2 * half * i) / 80;
        const value = nv * nv - 2 * t * (vv[0] * ww[0] + vv[1] * ww[1]) + t * t * nw * nw;
        peak = Math.max(peak, value);
        samples.push([t, value]);
      }
      const plot = mountGraph(graph, tStar - half, tStar + half, -peak * 0.08, peak * 1.12 + 0.4);
      if (!plot) return;
      axes(plot);
      path(plot, samples, INK, 1.7);
      segment(plot, tStar, 0, tStar, height, COPPER, 1.15, [3, 4]);
      dot(plot, tStar, height, COPPER, 4);
      text(plot, tStar, height, "t*");
      plot.ctx.font = "12.5px 'IBM Plex Mono', ui-monospace, monospace";
      plot.ctx.fillStyle = tone("#5e5a52");
      plot.ctx.textAlign = "left";
      plot.ctx.textBaseline = "top";
      plot.ctx.fillText("t", plot.w - 36, plot.sy(0) + 6);
    };
    drawRef.current();
  }, [v, w]);

  const { ip, nv, nw, cos, height } = measure(v, w);
  const equal = height < 1e-3 && nv > 1e-3 && nw > 1e-3;
  const formula = `|\\langle x,y\\rangle|=${fmt(Math.abs(ip))} \\le \\|x\\|\\,\\|y\\|=${fmt(nv * nw)}\\qquad \\|x\\|^2-\\frac{\\langle x,y\\rangle^2}{\\|y\\|^2}=${fmt(height)}\\qquad \\cos\\theta=${fmt(cos)}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.views}>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="\langle x,y\rangle = \|x\|\|y\|\cos\theta" />
          </p>
          <canvas ref={planeRef} className={`${styles.canvas} ${styles.plane}`} aria-label="Two vectors and the angle between them. Drag either tip." />
        </div>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="t \mapsto \|x-ty\|^2" />
          </p>
          <canvas ref={graphRef} className={styles.canvas} aria-label="The squared distance from x to the line of y, as a parabola" />
        </div>
      </div>
      <div className={styles.inline}>
        <button type="button" className={styles.text} onClick={() => { setV([1, 2]); setW([2, 1]); }}>
          Acute
        </button>
        <button type="button" className={styles.text} onClick={() => { setV([1, 2]); setW([-2, 1]); }}>
          Orthogonal
        </button>
        <button type="button" className={styles.text} onClick={() => { setV([1, 2]); setW([2, 4]); }}>
          Parallel
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag either tip. The parabola is the squared length of <Tex source="x-ty" />, and its lowest point is the projection onto the line of <Tex source="y" />. That height is nonnegative, which is Cauchy–Schwarz, and it {equal ? "is zero because the vectors are parallel" : "stays above zero because the vectors are not parallel"}. The same completion of the square is the comparison <Tex source="11 \le 15" /> for the notes&apos; vectors <Tex source="(1,2,2)" /> and <Tex source="(3,0,4)" />.
      </figcaption>
    </figure>
  );
}
