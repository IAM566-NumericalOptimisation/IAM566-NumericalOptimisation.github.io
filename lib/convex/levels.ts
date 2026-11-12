// Exact level curves for the curvature and domain figures (CF-08, CF-09).
// Curves are returned as parametric pieces, each a continuous arc, so that a
// plotting library that joins consecutive samples never draws a false bridge.

export type V2 = [number, number];
export type Piece = { domain: V2; xy: (t: number) => V2 };

/**
 * The level set ½(λ1 u1² + λ2 u2²) = c in eigen-coordinates, mapped to the plane by
 * x = u1 e1 + u2 e2 with e1 = (cos θ, sin θ), e2 = (−sin θ, cos θ). R bounds the arcs.
 */
export function quadLevel(l1: number, l2: number, theta: number, c: number, R = 5, tol = 1e-9): Piece[] {
  const [co, si] = [Math.cos(theta), Math.sin(theta)];
  const map = ([u1, u2]: V2): V2 => [u1 * co - u2 * si, u1 * si + u2 * co];
  const z1 = Math.abs(l1) < tol;
  const z2 = Math.abs(l2) < tol;
  const out: Piece[] = [];
  if (z1 && z2) return out; // f ≡ 0: every point is on the level 0, nothing to draw
  // one zero eigenvalue: parallel lines (or one line, or nothing)
  if (z1 || z2) {
    const l = z1 ? l2 : l1;
    const v = (2 * c) / l;
    if (v < -tol) return out;
    const a = Math.sqrt(Math.max(0, v));
    for (const s of a < tol ? [0] : [a, -a]) {
      out.push({ domain: [-R, R], xy: (t) => map(z1 ? [t, s] : [s, t]) });
    }
    return out;
  }
  // c = 0 with mixed signs: the two asymptotes
  if (Math.abs(c) < tol) {
    if (l1 * l2 > 0) return out; // the origin only
    const k = Math.sqrt(-l1 / l2);
    for (const s of [k, -k]) out.push({ domain: [-R, R], xy: (t) => map([t, s * t]) });
    return out;
  }
  const A2 = (2 * c) / l1;
  const B2 = (2 * c) / l2;
  if (A2 > 0 && B2 > 0) {
    const [A, B] = [Math.sqrt(A2), Math.sqrt(B2)];
    out.push({ domain: [0, 2 * Math.PI], xy: (t) => map([A * Math.cos(t), B * Math.sin(t)]) });
    return out;
  }
  if (A2 < 0 && B2 < 0) return out; // empty level
  // hyperbola: the axis with positive A2 (or B2) carries the cosh
  const onFirst = A2 > 0;
  const A = Math.sqrt(Math.abs(onFirst ? A2 : B2));
  const B = Math.sqrt(Math.abs(onFirst ? B2 : A2));
  const T = Math.min(Math.acosh(Math.max(1, R / A)), Math.asinh(R / B));
  for (const s of [1, -1]) {
    out.push({
      domain: [-T, T],
      xy: (t) => {
        const p = s * A * Math.cosh(t);
        const q = B * Math.sinh(t);
        return map(onFirst ? [p, q] : [q, p]);
      },
    });
  }
  return out;
}

/** Maximal subintervals of [lo, hi] on which g ≥ 0, endpoints refined by bisection. */
export function intervalsWhere(g: (x: number) => number, lo: number, hi: number, n = 600): V2[] {
  const xs = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const refine = (a: number, b: number) => {
    // g(a) and g(b) have opposite signs
    let [p, q] = [a, b];
    const sp = g(p) >= 0;
    for (let k = 0; k < 60; k++) {
      const m = (p + q) / 2;
      if (g(m) >= 0 === sp) p = m;
      else q = m;
    }
    return (p + q) / 2;
  };
  const out: V2[] = [];
  let start: number | null = g(xs[0]) >= 0 ? xs[0] : null;
  for (let i = 1; i <= n; i++) {
    const inNow = g(xs[i]) >= 0;
    const inPrev = g(xs[i - 1]) >= 0;
    if (inNow && !inPrev) start = refine(xs[i - 1], xs[i]);
    if (!inNow && inPrev && start !== null) {
      out.push([start, refine(xs[i - 1], xs[i])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, hi]);
  return out;
}

/** Level curves of x1³ − 3x1 + x2² = c over x1 ∈ [lo, hi]: x2 = ±√(c − x1³ + 3x1). */
export function cubicSaddleLevel(c: number, lo: number, hi: number): Piece[] {
  const g = (x: number) => c - (x ** 3 - 3 * x);
  const out: Piece[] = [];
  for (const [p, q] of intervalsWhere(g, lo, hi)) {
    for (const s of [1, -1]) out.push({ domain: [p, q], xy: (t) => [t, s * Math.sqrt(Math.max(0, g(t)))] });
  }
  return out;
}
