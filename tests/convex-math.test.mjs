// Exact fixtures of the Convex Functions chapter, checked against lib/convex/models.ts.
// Run: npm run test:math   (node --experimental-strip-types --test tests/)
import assert from "node:assert/strict";
import test from "node:test";
import {
  FN1,
  boundOnInterval,
  chord,
  cubic,
  cubicSaddle,
  cubicSaddleHess,
  definiteness,
  degenerateChord,
  eig2,
  epiMargin,
  EPI,
  hessian,
  jensen,
  lineA,
  lstsq2,
  near,
  q3,
  q3bound,
  q3grad,
  quadForm,
  quotient,
  rank1,
  RANK1,
  sublevel,
  squareGap,
  texNum,
} from "../lib/convex/models.ts";

const close = (a, b, msg) => assert.ok(near(a, b, 1e-9, 1e-9), `${msg ?? ""} expected ${b}, got ${a}`);

test("x² chord at endpoints -1, 2 and t = 1/2", () => {
  const c = chord(FN1.sq.f, -1, 2, 0.5);
  close(c.z, 0.5);
  close(c.fz, 0.25);
  close(c.ell, 2.5);
  close(c.gap, 9 / 4);
  close(c.gap, squareGap(-1, 2, 0.5));
});

test("x² gap equals t(1-t)(a-b)² on a grid, and is maximal at t = 1/2", () => {
  for (const a of [-2, -0.5, 0, 1.3]) for (const b of [-1, 0.7, 2]) for (const t of [0, 0.1, 0.5, 0.9, 1]) close(chord(FN1.sq.f, a, b, t).gap, squareGap(a, b, t));
  assert.ok(squareGap(-1, 2, 0.5) > squareGap(-1, 2, 0.4));
});

test("x³ at -2, 0 midpoint has gap -3", () => close(chord(FN1.cube.f, -2, 0, 0.5).gap, -3));

test("√|x| at 0, 4 midpoint has gap 1 - √2", () => close(chord(FN1.sqrtabs.f, 0, 4, 0.5).gap, 1 - Math.SQRT2));

test("|x| at 1, 2 has zero gap for every t", () => {
  for (const t of [0, 0.25, 0.5, 0.75, 1]) close(chord(FN1.abs.f, 1, 2, t).gap, 0);
});

test("degenerate chords are flagged", () => {
  assert.ok(degenerateChord(1, 1, 0.5));
  assert.ok(degenerateChord(-1, 2, 0));
  assert.ok(degenerateChord(-1, 2, 1));
  assert.ok(!degenerateChord(-1, 2, 0.5));
});

test("capped V: midpoint of (1,0), (3,1) is outside the epigraph", () => {
  const { f, domain } = EPI.capped;
  assert.ok(epiMargin(f, domain, 1, 0) >= 0);
  assert.ok(epiMargin(f, domain, 3, 1) >= 0);
  close(epiMargin(f, domain, 2, 0.5), -0.5);
  assert.ok(Number.isNaN(epiMargin(f, domain, 3.5, 4)));
});

test("ring sublevel sets", () => {
  assert.deepEqual(sublevel("ring", -0.1), { kind: "empty" });
  assert.deepEqual(sublevel("ring", 0), { kind: "circle", r: 1 });
  const q = sublevel("ring", 0.25);
  assert.equal(q.kind, "annulus");
  close(q.rin, Math.sqrt(0.5));
  close(q.rout, Math.sqrt(1.5));
  const one = sublevel("ring", 1);
  assert.equal(one.kind, "disk");
  close(one.r, Math.SQRT2);
});

test("bowl and √|x| sublevel sets", () => {
  assert.deepEqual(sublevel("bowl", 0), { kind: "point" });
  close(sublevel("bowl", 4).r, 2);
  const s = sublevel("sqrtabs", 1.5);
  close(s.lo, -2.25);
  close(s.hi, 2.25);
});

test("difference quotient refuses s = 0 and tends to f'(a)(b-a)", () => {
  assert.throws(() => quotient(FN1.sq.f, 1, 3, 0));
  close(quotient(FN1.sq.f, 1, 3, 1e-6), 2 * 1 * 2 + 4e-6);
});

test("tangent bounds for x² on [1, 3]", () => {
  close(boundOnInterval(2), 0);
  close(boundOnInterval(1), 1);
  for (const a of [1, 1.5, 2, 2.5, 3]) assert.ok(boundOnInterval(a) <= 1 + 1e-12);
});

test("x1² + x1x2 + x2² on x ≥ (1,1)", () => {
  close(q3([2, 1]), 7);
  assert.deepEqual(q3grad([2, 1]), [5, 4]);
  close(q3bound([2, 1]), 2);
  close(q3bound([1, 1]), 3);
  assert.deepEqual(q3grad([1, 1]), [3, 3]);
});

test("H = [[2,3],[3,2]] has curvature -1 along (1,-1)/√2", () => {
  const H = [
    [2, 3],
    [3, 2],
  ];
  close(quadForm(H, [Math.SQRT1_2, -Math.SQRT1_2]), -1);
  assert.equal(definiteness(eig2(H)), "indefinite");
});

test("rotated Hessian family and its classification", () => {
  const H = hessian(1, 2, 0.7);
  const [a, b] = eig2(H);
  close(a, 2);
  close(b, 1);
  assert.equal(definiteness(eig2(hessian(0, 2, 0.3))), "positive semidefinite");
  assert.equal(definiteness(eig2(hessian(-1, 2, 0.3))), "indefinite");
  assert.equal(definiteness(eig2(hessian(-1, -2, 0.3))), "negative definite");
  assert.equal(definiteness(eig2(hessian(0, 0, 0.3))), "zero");
});

test("quadratic of §8.2: minimizer (1,-1), value -1", () => {
  const f = ([x, y]) => 2 * x * x + 2 * x * y + y * y - 2 * x;
  close(f([1, -1]), -1);
  // gradient (4x1 + 2x2 - 2, 2x1 + 2x2) vanishes there
  close(4 - 2 - 2, 0);
  assert.equal(definiteness(eig2([[4, 2], [2, 2]])), "positive definite");
});

test("modified cross term: stationary (-1/2, 1), value 1/2, indefinite", () => {
  const f = ([x, y]) => 2 * x * x + 4 * x * y + y * y - 2 * x;
  const g = ([x, y]) => [4 * x + 4 * y - 2, 4 * x + 2 * y];
  close(f([-0.5, 1]), 0.5);
  assert.deepEqual(g([-0.5, 1]).map((v) => Math.abs(v)), [0, 0]);
  assert.equal(definiteness(eig2([[4, 4], [4, 2]])), "indefinite");
  close(quadForm([[4, 4], [4, 2]], [1, -2]) / 2, -2);
});

test("cubic in one and two variables", () => {
  close(cubic(1), -2);
  close(cubic(-3), -18);
  close(cubicSaddle([1, 0]), -2);
  assert.equal(definiteness(eig2(cubicSaddleHess([1, 0]))), "positive definite");
  assert.equal(definiteness(eig2(cubicSaddleHess([-1, 0]))), "indefinite");
});

test("rank-one least squares: x† = (3/5, 6/5), f* = 7, fit (3,3,3)", () => {
  const r = rank1(RANK1.b);
  close(r.xd[0], 3 / 5);
  close(r.xd[1], 6 / 5);
  close(r.f, 7);
  r.fit.forEach((v) => close(v, 3));
  // moving along the null direction keeps the fit and the objective, and grows the norm
  const s = rank1(RANK1.b, 0.8);
  close(s.f, 7);
  s.fit.forEach((v) => close(v, 3));
  close(Math.hypot(...s.x) ** 2, 9 / 5 + 0.64 * 5);
});

test("full-rank line fit: (5/6, 3/2), f* = 1/12", () => {
  const r = lstsq2(lineA(), [1, 2, 4]);
  close(r.x[0], 5 / 6);
  close(r.x[1], 3 / 2);
  close(r.f, 1 / 12);
  close(r.res[0], 1 / 6);
  close(r.res[1], -1 / 3);
});

test("equal-weight Jensen preset", () => {
  const j = jensen([-1, 0, 2], [1, 1, 1]);
  close(j.mean, 1 / 3);
  close(j.meanSq, 5 / 3);
  close(j.sqMean, 1 / 9);
  close(j.gap, 14 / 9);
  close(j.variance, 14 / 9);
  assert.equal(jensen([1, 2], [0, 0]), null);
});

test("exact LaTeX numbers", () => {
  assert.equal(texNum(9 / 4), "\\tfrac{9}{4}");
  assert.equal(texNum(-3), "-3");
  assert.equal(texNum(-0), "0");
  assert.equal(texNum(1 / 12), "\\tfrac{1}{12}");
  assert.equal(texNum(Math.SQRT2), "1.414");
});
