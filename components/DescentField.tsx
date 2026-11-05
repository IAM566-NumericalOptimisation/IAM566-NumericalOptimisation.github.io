"use client";

import { useEffect, useRef } from "react";

// Gradient descent on Himmelblau's function
//   f(x, y) = (x² + y − 11)² + (x + y² − 7)²,
// which has four minima (value 0). Walkers start at random points, follow
// −∇f with a capped step, leave a trail, and start over once they settle.

const f = (x: number, y: number) => (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2;
const grad = (x: number, y: number): [number, number] => {
  const a = x * x + y - 11;
  const b = x + y * y - 7;
  return [4 * x * a + 2 * b, 2 * a + 4 * y * b];
};

const R = 5.2; // the shorter side of the window spans [−R, R]

export function DescentField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let contours: HTMLCanvasElement | null = null;
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    type Walker = { x: number; y: number; trail: [number, number][]; still: number };
    let walkers: Walker[] = [];

    const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const S = () => Math.min(w, h) / (2 * R);
    // half-widths of the window in function coordinates
    const RX = () => w / 2 / S();
    const RY = () => h / 2 / S();
    const px = (x: number) => w / 2 + x * S();
    const py = (y: number) => h / 2 - y * S();

    const spawn = (): Walker => ({ x: (rand() * 2 - 1) * Math.min(RX(), 7) * 0.9, y: (rand() * 2 - 1) * RY() * 0.9, trail: [], still: 0 });

    /** Level sets of log(1 + f) by marching squares, drawn once per size/theme. */
    const drawContours = () => {
      const off = document.createElement("canvas");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      off.width = Math.round(w * dpr);
      off.height = Math.round(h * dpr);
      const c = off.getContext("2d")!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const N = 160;
      const val = new Float32Array((N + 1) * (N + 1));
      const xs = (i: number) => -RX() + (2 * RX() * i) / N;
      const ys = (j: number) => -RY() + (2 * RY() * j) / N;
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) val[j * (N + 1) + i] = Math.log1p(f(xs(i), ys(j)));
      const ink = css("--ink");
      const accent = css("--accent");
      for (let L = 0.4; L < 9; L += 0.55) {
        c.strokeStyle = L < 2.5 ? accent : ink;
        c.globalAlpha = L < 2.5 ? 0.35 : 0.09;
        c.lineWidth = 1;
        c.beginPath();
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const a = val[j * (N + 1) + i];
            const b = val[j * (N + 1) + i + 1];
            const d = val[(j + 1) * (N + 1) + i + 1];
            const e = val[(j + 1) * (N + 1) + i];
            const pts: [number, number][] = [];
            const edge = (p: number, q: number, x0: number, y0: number, x1: number, y1: number) => {
              if ((p < L) !== (q < L)) {
                const t = (L - p) / (q - p);
                pts.push([px(xs(x0 + (x1 - x0) * t)), py(ys(y0 + (y1 - y0) * t))]);
              }
            };
            edge(a, b, i, j, i + 1, j);
            edge(b, d, i + 1, j, i + 1, j + 1);
            edge(e, d, i, j + 1, i + 1, j + 1);
            edge(a, e, i, j, i, j + 1);
            for (let k = 0; k + 1 < pts.length; k += 2) {
              c.moveTo(pts[k][0], pts[k][1]);
              c.lineTo(pts[k + 1][0], pts[k + 1][1]);
            }
          }
        }
        c.stroke();
      }
      contours = off;
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawContours();
      walkers = Array.from({ length: 18 }, spawn);
    };

    const step = () => {
      for (const p of walkers) {
        const [gx, gy] = grad(p.x, p.y);
        const g = Math.hypot(gx, gy);
        // a fixed rate with the step length capped, so far walkers do not overshoot
        const len = Math.min(0.006 * g, 0.12);
        const nx = g > 1e-9 ? p.x - (gx / g) * len : p.x;
        const ny = g > 1e-9 ? p.y - (gy / g) * len : p.y;
        p.trail.push([nx, ny]);
        if (p.trail.length > 90) p.trail.shift();
        p.still = len < 0.002 ? p.still + 1 : 0;
        p.x = nx;
        p.y = ny;
      }
      walkers = walkers.map((p) => (p.still > 80 ? spawn() : p));
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      if (contours) ctx.drawImage(contours, 0, 0, w, h);
      const accent = css("--accent");
      const copper = css("--copper");
      for (const p of walkers) {
        const tr = p.trail;
        for (let k = 1; k < tr.length; k++) {
          ctx.strokeStyle = accent;
          ctx.globalAlpha = (k / tr.length) * 0.7;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(px(tr[k - 1][0]), py(tr[k - 1][1]));
          ctx.lineTo(px(tr[k][0]), py(tr[k][1]));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // the four minima
      ctx.fillStyle = copper;
      for (const [x, y] of [[3, 2], [-2.805118, 3.131312], [-3.77931, -3.283186], [3.584428, -1.848126]]) {
        ctx.beginPath();
        ctx.arc(px(x), py(y), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      if (visible && !document.hidden) {
        step();
        step();
        render();
      }
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) {
      for (let k = 0; k < 160; k++) step();
      render();
    } else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) render();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const onTheme = () => {
      drawContours();
      render();
    };
    window.addEventListener("themechange", onTheme);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("themechange", onTheme);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-label="Gradient descent on Himmelblau's function: paths falling into its four minima" role="img" />;
}
