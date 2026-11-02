export const INK = "#1c1b18";
export const GREEN = "#1d4e48";
export const COPPER = "#8a3e2a";
export const BLUE = "#2c4a6e";
export const FAINT = "rgba(28,27,24,0.32)";

const DARK: Record<string, string> = {
  "#1c1b18": "#ece8df",
  "#1d4e48": "#8fbfb6",
  "#8a3e2a": "#e0a08c",
  "#2c4a6e": "#9eb9dc",
  "rgba(28,27,24,0.32)": "rgba(236,232,223,0.4)",
  "rgba(28,27,24,0.25)": "rgba(236,232,223,0.32)",
  "#5e5a52": "#b0aba0",
};

export function tone(color: string) {
  if (typeof document === "undefined" || document.documentElement.dataset.theme !== "dark") return color;
  return DARK[color] ?? color;
}

export type View = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  wx: (px: number) => number;
  wy: (py: number) => number;
};

function context(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 420;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return { ctx, w, h };
}

export function mountPlane(canvas: HTMLCanvasElement, cx: number, cy: number, span: number): View | null {
  const setup = context(canvas);
  if (!setup) return null;
  const { ctx, w, h } = setup;
  const pad = 28;
  const scale = Math.min(w - 2 * pad, h - 2 * pad) / (2 * span);
  const sx = (x: number) => w / 2 + (x - cx) * scale;
  const sy = (y: number) => h / 2 - (y - cy) * scale;
  const wx = (px: number) => cx + (px - w / 2) / scale;
  const wy = (py: number) => cy - (py - h / 2) / scale;
  return { ctx, w, h, x0: wx(pad), x1: wx(w - pad), y0: wy(h - pad), y1: wy(pad), sx, sy, wx, wy };
}

export function mountGraph(canvas: HTMLCanvasElement, x0: number, x1: number, y0: number, y1: number): View | null {
  const setup = context(canvas);
  if (!setup) return null;
  const { ctx, w, h } = setup;
  const pad = 32;
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0)) * (w - 2 * pad);
  const sy = (y: number) => h - pad - ((y - y0) / (y1 - y0)) * (h - 2 * pad);
  const wx = (px: number) => x0 + ((px - pad) / (w - 2 * pad)) * (x1 - x0);
  const wy = (py: number) => y0 + ((h - pad - py) / (h - 2 * pad)) * (y1 - y0);
  return { ctx, w, h, x0, x1, y0, y1, sx, sy, wx, wy };
}

export function axes(view: View) {
  const { ctx, sx, sy, x0, x1, y0, y1 } = view;
  ctx.strokeStyle = tone(FAINT);
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (y0 < 0 && y1 > 0) {
    ctx.moveTo(sx(x0), sy(0));
    ctx.lineTo(sx(x1), sy(0));
  }
  if (x0 < 0 && x1 > 0) {
    ctx.moveTo(sx(0), sy(y0));
    ctx.lineTo(sx(0), sy(y1));
  }
  ctx.stroke();
}

export function segment(
  view: View,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1.25,
  dash?: number[],
) {
  const { ctx, sx, sy } = view;
  ctx.save();
  ctx.strokeStyle = tone(color);
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx(x0), sy(y0));
  ctx.lineTo(sx(x1), sy(y1));
  ctx.stroke();
  ctx.restore();
}

export function arrow(
  view: View,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1.7,
) {
  const { ctx, sx, sy } = view;
  const ax = sx(x0);
  const ay = sy(y0);
  const bx = sx(x1);
  const by = sy(y1);
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 2) return;
  const ang = Math.atan2(by - ay, bx - ax);
  const head = Math.min(13, Math.max(7, len * 0.16));
  ctx.strokeStyle = tone(color);
  ctx.fillStyle = tone(color);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx - Math.cos(ang) * head * 0.55, by - Math.sin(ang) * head * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - head * Math.cos(ang - 0.38), by - head * Math.sin(ang - 0.38));
  ctx.lineTo(bx - head * Math.cos(ang + 0.38), by - head * Math.sin(ang + 0.38));
  ctx.closePath();
  ctx.fill();
}

export function path(view: View, pts: Array<[number, number]>, color: string, width = 1.6) {
  if (pts.length < 2) return;
  const { ctx, sx, sy } = view;
  ctx.beginPath();
  ctx.strokeStyle = tone(color);
  ctx.lineWidth = width;
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))));
  ctx.stroke();
}

export function rule(
  view: View,
  px: number,
  py: number,
  dx: number,
  dy: number,
  color: string,
  width = 1.15,
  dash?: number[],
) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const { x0, x1, y0, y1 } = view;
  const ts: number[] = [];
  if (Math.abs(ux) > 1e-8) ts.push((x0 - px) / ux, (x1 - px) / ux);
  if (Math.abs(uy) > 1e-8) ts.push((y0 - py) / uy, (y1 - py) / uy);
  const hits: Array<[number, number]> = [];
  for (const t of ts) {
    const x = px + t * ux;
    const y = py + t * uy;
    if (x >= x0 - 1e-3 && x <= x1 + 1e-3 && y >= y0 - 1e-3 && y <= y1 + 1e-3) hits.push([x, y]);
  }
  if (hits.length < 2) return;
  let far = 1;
  let best = -1;
  for (let i = 1; i < hits.length; i++) {
    const d = Math.hypot(hits[i][0] - hits[0][0], hits[i][1] - hits[0][1]);
    if (d > best) {
      best = d;
      far = i;
    }
  }
  segment(view, hits[0][0], hits[0][1], hits[far][0], hits[far][1], color, width, dash);
}

export function dot(view: View, x: number, y: number, color: string, r = 3.5) {
  const { ctx, sx, sy } = view;
  ctx.beginPath();
  ctx.fillStyle = tone(color);
  ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
  ctx.fill();
}

export function text(view: View, x: number, y: number, label: string, color = INK) {
  const { ctx, sx, sy } = view;
  ctx.font = "12.5px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = tone(color);
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, sx(x) + 8, sy(y) - 6);
}

export function near(view: View, x: number, y: number, px: number, py: number, r = 16) {
  return Math.hypot(view.sx(x) - px, view.sy(y) - py) <= r;
}

export function rightAngle(
  view: View,
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const na = Math.hypot(ax, ay) || 1;
  const nb = Math.hypot(bx, by) || 1;
  const sax = ax / na;
  const say = -ay / na;
  const sbx = bx / nb;
  const sby = -by / nb;
  const size = 12;
  const { ctx, sx, sy } = view;
  const ox = sx(x);
  const oy = sy(y);
  ctx.beginPath();
  ctx.strokeStyle = tone(COPPER);
  ctx.lineWidth = 1.2;
  ctx.moveTo(ox + sax * size, oy + say * size);
  ctx.lineTo(ox + (sax + sbx) * size, oy + (say + sby) * size);
  ctx.lineTo(ox + sbx * size, oy + sby * size);
  ctx.stroke();
}

export function arc(view: View, from: number, to: number, rPx: number, color: string) {
  let a0 = from;
  let a1 = to;
  while (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
  while (a0 - a1 > Math.PI) a0 -= Math.PI * 2;
  if (Math.abs(a1 - a0) < 0.05) return;
  const { ctx, sx, sy } = view;
  ctx.beginPath();
  ctx.strokeStyle = tone(color);
  ctx.lineWidth = 1.2;
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const px = sx(0) + Math.cos(a) * rPx;
    const py = sy(0) - Math.sin(a) * rPx;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

export function bindDrag(
  canvas: HTMLCanvasElement,
  hit: (px: number, py: number) => string | null,
  move: (id: string, px: number, py: number) => void,
) {
  let id: string | null = null;
  const local = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top] as const;
  };
  const down = (event: PointerEvent) => {
    const [px, py] = local(event);
    id = hit(px, py);
    if (!id) return;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (!id) return;
    const [px, py] = local(event);
    move(id, px, py);
  };
  const up = () => {
    id = null;
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
  };
}
