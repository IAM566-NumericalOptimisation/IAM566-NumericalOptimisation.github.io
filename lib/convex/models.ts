// Pure mathematics for the Convex Functions chapter (chapter 6).
// No React here: every figure derives what it draws from these functions, and
// tests/convex-math.test.mjs checks them against the chapter's exact values.

export type V2 = [number, number];

/* numbers --------------------------------------------------------------------- */

/** Equality with both an absolute and a relative tolerance. */
export const near = (a: number, b: number, abs = 1e-9, rel = 1e-9) => Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * A number as LaTeX: an exact small fraction when it is one (denominator up to
 * 12, plus 15, 18, 24, 36), otherwise three decimals. Never "-0".
 */
export function texNum(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return n > 0 ? "\\infty" : "-\\infty";
  for (const d of [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 24, 36]) {
    const p = Math.round(n * d);
    if (Math.abs(n * d - p) < 1e-9) {
      if (p === 0) return "0";
      const g = gcd(Math.abs(p), d);
      const [pp, dd] = [p / g, d / g];
      return dd === 1 ? String(pp) : `${pp < 0 ? "-" : ""}\\tfrac{${Math.abs(pp)}}{${dd}}`;
    }
  }
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) || r === 0 ? "0" : String(r);
}

/** Sign of a numerically computed quantity, with an explicit "approximately zero" band. */
export type Sign = "positive" | "zero" | "negative";
export const signOf = (n: number, tol = 1e-9): Sign => (n > tol ? "positive" : n < -tol ? "negative" : "zero");

/* one-variable presets (CF-01, CF-06) ------------------------------------------ */

export type Classification = {
  convex: boolean;
  strict: boolean;
  concave: boolean;
  /** One line stating the analytic reason, used in the figures. */
  reason: string;
};

export type Fn1 = {
  id: string;
  tex: string;
  f: (x: number) => number;
  /** derivative, where it exists; `null` where f is not differentiable */
  df?: (x: number) => number | null;
  d2f?: (x: number) => number | null;
  /** domain of definition (closed interval endpoints may be infinite) */
  domain: V2;
  view: { x: V2; y: V2 };
  /** Classification on the whole domain, from analysis, never from sampling. */
  cls: Classification;
};

export const FN1: Record<string, Fn1> = {
  sq: {
    id: "sq",
    tex: "x^2",
    f: (x) => x * x,
    df: (x) => 2 * x,
    d2f: () => 2,
    domain: [-Infinity, Infinity],
    view: { x: [-3, 3.4], y: [-1, 5.5] },
    cls: { convex: true, strict: true, concave: false, reason: "G = t(1-t)(x-y)^2 \\ge 0,\\ >0 \\text{ for } x\\ne y,\\ 0<t<1" },
  },
  quart: {
    id: "quart",
    tex: "x^4",
    f: (x) => x ** 4,
    df: (x) => 4 * x ** 3,
    d2f: (x) => 12 * x * x,
    domain: [-Infinity, Infinity],
    view: { x: [-2, 2.2], y: [-0.8, 5] },
    cls: { convex: true, strict: true, concave: false, reason: "\\text{tangent gap } (y-x)^2\\big((y+x)^2+2x^2\\big) > 0 \\text{ for } y\\ne x" },
  },
  abs: {
    id: "abs",
    tex: "|x|",
    f: (x) => Math.abs(x),
    df: (x) => (x === 0 ? null : Math.sign(x)),
    d2f: (x) => (x === 0 ? null : 0),
    domain: [-Infinity, Infinity],
    view: { x: [-3, 3.4], y: [-1, 3.6] },
    cls: { convex: true, strict: false, concave: false, reason: "\\text{a norm: triangle inequality; equality along } 0 \\le x \\le y" },
  },
  cube: {
    id: "cube",
    tex: "x^3",
    f: (x) => x ** 3,
    df: (x) => 3 * x * x,
    d2f: (x) => 6 * x,
    domain: [-Infinity, Infinity],
    view: { x: [-2.6, 2.6], y: [-5, 5] },
    cls: { convex: false, strict: false, concave: false, reason: "\\text{endpoints } -2,0:\\ f(-1)=-1 > -4 \\text{ (not convex)}" },
  },
  affine: {
    id: "affine",
    tex: "\\tfrac12 x + 1",
    f: (x) => 0.5 * x + 1,
    df: () => 0.5,
    d2f: () => 0,
    domain: [-Infinity, Infinity],
    view: { x: [-3, 3.4], y: [-1, 3.6] },
    cls: { convex: true, strict: false, concave: true, reason: "\\text{affine: equality in every chord inequality}" },
  },
  sqrtabs: {
    id: "sqrtabs",
    tex: "\\sqrt{|x|}",
    f: (x) => Math.sqrt(Math.abs(x)),
    df: (x) => (x === 0 ? null : Math.sign(x) / (2 * Math.sqrt(Math.abs(x)))),
    domain: [-Infinity, Infinity],
    view: { x: [-1.5, 5.2], y: [-0.6, 2.8] },
    cls: { convex: false, strict: false, concave: false, reason: "\\text{endpoints } 0,4:\\ f(2)=\\sqrt2 > 1 \\text{ (not convex)}" },
  },
};

export type Chord = { z: number; fz: number; ell: number; gap: number };

/** z = (1-t)a + tb, the graph height f(z), the chord height ℓ and the gap G = ℓ - f(z). */
export function chord(f: (x: number) => number, a: number, b: number, t: number): Chord {
  const z = (1 - t) * a + t * b;
  const fz = f(z);
  const ell = (1 - t) * f(a) + t * f(b);
  return { z, fz, ell, gap: ell - fz };
}

/** The exact chord gap of x²: t(1-t)(a-b)². */
export const squareGap = (a: number, b: number, t: number) => t * (1 - t) * (a - b) ** 2;

/** Endpoints coincide or t is 0 or 1: equality is forced, so it says nothing about strictness. */
export const degenerateChord = (a: number, b: number, t: number) => a === b || t === 0 || t === 1;

/* local to global (CF-02) -------------------------------------------------------- */

/** The largest t that keeps z_t = x* + t(y - x*) inside the δ-ball, capped below 1. */
export const tInside = (dist: number, delta: number) => Math.min(1, delta / dist);

/** x³ - 3x on [-3, 3]: stationary points ±1, values. */
export const cubic = (x: number) => x ** 3 - 3 * x;

/* optimal sets (CF-03) ------------------------------------------------------------ */

export const OPT2: Record<string, { tex: string; f: (p: V2) => number; fstar: number; kind: "line" | "segment" | "point"; box?: [V2, V2] }> = {
  valley: { tex: "x_1^2", f: ([x]) => x * x, fstar: 0, kind: "line" },
  diag: { tex: "(x_1+x_2-1)^2", f: ([x, y]) => (x + y - 1) ** 2, fstar: 0, kind: "segment", box: [[0, 0], [1, 1]] },
  bowl: { tex: "x_1^2+x_2^2", f: ([x, y]) => x * x + y * y, fstar: 0, kind: "point" },
};

/* epigraphs (CF-04) ---------------------------------------------------------------- */

export const EPI: Record<string, { tex: string; f: (x: number) => number; domain: V2; convex: boolean }> = {
  sq: { tex: "x^2", f: (x) => x * x, domain: [-2, 2], convex: true },
  cube: { tex: "x^3", f: (x) => x ** 3, domain: [-1.6, 1.6], convex: false },
  vee: { tex: "|x-1|\\ \\text{on}\\ [0,3]", f: (x) => Math.abs(x - 1), domain: [0, 3], convex: true },
  capped: { tex: "\\min\\{|x-1|,1\\}\\ \\text{on}\\ [0,3]", f: (x) => Math.min(Math.abs(x - 1), 1), domain: [0, 3], convex: false },
};

/** Membership margin of (x, r) in the epigraph (≥ 0 inside) or hypograph (≤ 0 inside); NaN off the domain. */
export function epiMargin(f: (x: number) => number, domain: V2, x: number, r: number) {
  if (x < domain[0] - 1e-12 || x > domain[1] + 1e-12) return NaN;
  return r - f(x);
}

/* sublevel sets (CF-05) ---------------------------------------------------------- */

export type Sublevel =
  | { kind: "empty" }
  | { kind: "point" }
  | { kind: "disk"; r: number }
  | { kind: "circle"; r: number }
  | { kind: "annulus"; rin: number; rout: number }
  | { kind: "diamond"; r: number }
  | { kind: "interval"; lo: number; hi: number };

/** Exact sublevel geometry. The case split on α comes first; no square root of a negative number is taken. */
export function sublevel(id: "bowl" | "ring" | "diamond" | "sqrtabs", alpha: number): Sublevel {
  if (alpha < 0) return { kind: "empty" };
  switch (id) {
    case "bowl":
      return alpha === 0 ? { kind: "point" } : { kind: "disk", r: Math.sqrt(alpha) };
    case "ring": {
      if (alpha === 0) return { kind: "circle", r: 1 };
      const s = Math.sqrt(alpha);
      if (alpha < 1) return { kind: "annulus", rin: Math.sqrt(1 - s), rout: Math.sqrt(1 + s) };
      return { kind: "disk", r: Math.sqrt(1 + s) };
    }
    case "diamond":
      return alpha === 0 ? { kind: "point" } : { kind: "diamond", r: alpha };
    case "sqrtabs":
      return { kind: "interval", lo: -alpha * alpha, hi: alpha * alpha };
  }
}

export const ring = ([x, y]: V2) => (x * x + y * y - 1) ** 2;

/* tangents (CF-06, CF-07) --------------------------------------------------------- */

/** Difference quotient (f(a + s(b-a)) - f(a)) / s, for s > 0 only. */
export function quotient(f: (x: number) => number, a: number, b: number, s: number) {
  if (!(s > 0)) throw new Error("the difference quotient needs s > 0; use the derivative at s = 0");
  return (f(a + s * (b - a)) - f(a)) / s;
}

/** Tangent line of a differentiable f at a. */
export const tangent = (f: (x: number) => number, df: (x: number) => number, a: number) => (x: number) => f(a) + df(a) * (x - a);

/** Tangent lower bound of x² on [1, 3] from base point a: min over [1,3] of 2ax - a². */
export function boundOnInterval(a: number, lo = 1, hi = 3) {
  const slope = 2 * a;
  const at = slope >= 0 ? lo : hi;
  return 2 * a * at - a * a;
}

/** f(x) = x1² + x1 x2 + x2², its gradient and the tangent bound over {x1 ≥ 1, x2 ≥ 1}. */
export const q3 = ([x, y]: V2) => x * x + x * y + y * y;
export const q3grad = ([x, y]: V2): V2 => [2 * x + y, x + 2 * y];
export function q3bound(a: V2) {
  const g = q3grad(a);
  // h(x) = f(a) + g·(x - a); on x ≥ (1,1) its infimum is finite iff g ≥ 0, attained at (1,1)
  if (g[0] < 0 || g[1] < 0) return -Infinity;
  return q3(a) + g[0] * (1 - a[0]) + g[1] * (1 - a[1]);
}

/* Hessians (CF-08) -------------------------------------------------------------- */

export type M2 = [[number, number], [number, number]];

/** H = R(θ) diag(λ1, λ2) R(θ)ᵀ. */
export function hessian(l1: number, l2: number, theta: number): M2 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [
    [l1 * c * c + l2 * s * s, (l1 - l2) * c * s],
    [(l1 - l2) * c * s, l1 * s * s + l2 * c * c],
  ];
}

export const quadForm = (H: M2, [x, y]: V2) => H[0][0] * x * x + 2 * H[0][1] * x * y + H[1][1] * y * y;

/** Eigenvalues of a symmetric 2×2 matrix, larger first. */
export function eig2(H: M2): V2 {
  const m = (H[0][0] + H[1][1]) / 2;
  const r = Math.hypot((H[0][0] - H[1][1]) / 2, H[0][1]);
  return [m + r, m - r];
}

export type Definiteness = "positive definite" | "positive semidefinite" | "zero" | "negative semidefinite" | "negative definite" | "indefinite";

/** Classification from eigenvalues, with a tolerance band for "zero". */
export function definiteness([a, b]: V2, tol = 1e-9): Definiteness {
  const sa = signOf(a, tol);
  const sb = signOf(b, tol);
  if (sa === "zero" && sb === "zero") return "zero";
  if (sa === "positive" && sb === "positive") return "positive definite";
  if (sa === "negative" && sb === "negative") return "negative definite";
  if (sa !== "negative" && sb !== "negative") return "positive semidefinite";
  if (sa !== "positive" && sb !== "positive") return "negative semidefinite";
  return "indefinite";
}

/* domain-dependent convexity (CF-09) ------------------------------------------------ */

export const cubicSaddle = ([x, y]: V2) => x ** 3 - 3 * x + y * y;
export const cubicSaddleHess = ([x]: V2): M2 => [
  [6 * x, 0],
  [0, 2],
];

/* least squares (CF-10) ------------------------------------------------------------- */

/** Least squares with two columns by modified Gram–Schmidt QR (no normal equations, no inverse). */
export function lstsq2(A: number[][], b: number[]) {
  const m = A.length;
  const a1 = A.map((r) => r[0]);
  const a2 = A.map((r) => r[1]);
  const dot = (u: number[], v: number[]) => u.reduce((s, ui, i) => s + ui * v[i], 0);
  const r11 = Math.sqrt(dot(a1, a1));
  const q1 = a1.map((v) => v / r11);
  const r12 = dot(q1, a2);
  const w = a2.map((v, i) => v - r12 * q1[i]);
  const r22 = Math.sqrt(dot(w, w));
  if (r22 <= 1e-12 * Math.max(1, r11)) throw new Error("A is numerically rank deficient; use the SVD form");
  const q2 = w.map((v) => v / r22);
  const c1 = dot(q1, b);
  const c2 = dot(q2, b);
  const x2 = c2 / r22;
  const x1 = (c1 - r12 * x2) / r11;
  const fit = A.map((r) => r[0] * x1 + r[1] * x2);
  const res = b.map((bi, i) => bi - fit[i]);
  return { x: [x1, x2] as V2, fit, res, f: 0.5 * dot(res, res), m };
}

/** The chapter's rank-one example: every row of A is (1, 2). */
export const RANK1 = {
  A: [
    [1, 2],
    [1, 2],
    [1, 2],
  ],
  b: [1, 2, 6],
  sigma: Math.sqrt(15),
  v1: [1 / Math.sqrt(5), 2 / Math.sqrt(5)] as V2,
  null: [-2, 1] as V2,
};

/** Minimum-norm solution of the rank-one problem by its SVD: x† = (u1ᵀb / σ1) v1, u1 = (1,1,1)/√3. */
export function rank1(b: number[], s = 0) {
  const u1b = b.reduce((acc, v) => acc + v, 0) / Math.sqrt(3);
  const c = u1b / RANK1.sigma;
  const xd: V2 = [c * RANK1.v1[0], c * RANK1.v1[1]];
  const x: V2 = [xd[0] + s * RANK1.null[0], xd[1] + s * RANK1.null[1]];
  const pred = x[0] + 2 * x[1];
  const fit = [pred, pred, pred];
  const res = b.map((bi) => bi - pred);
  return { xd, x, fit, res, f: 0.5 * res.reduce((a, r) => a + r * r, 0) };
}

/** The chapter's line-fitting design matrix at t = 0, 1, 2. */
export const LINE_T = [0, 1, 2];
export const lineA = (ts: number[] = LINE_T) => ts.map((t) => [1, t]);

/* Jensen (CF-11) -------------------------------------------------------------------- */

export function jensen(xs: number[], ws: number[]) {
  const total = ws.reduce((a, w) => a + w, 0);
  if (!(total > 0)) return null;
  const w = ws.map((v) => v / total);
  const mean = w.reduce((a, wi, i) => a + wi * xs[i], 0);
  const meanSq = w.reduce((a, wi, i) => a + wi * xs[i] * xs[i], 0);
  const variance = w.reduce((a, wi, i) => a + wi * (xs[i] - mean) ** 2, 0);
  return { w, mean, meanSq, sqMean: mean * mean, gap: meanSq - mean * mean, variance };
}
