// Level-curve helpers of CF-08 and CF-09: every sampled point lies on its level.
import assert from "node:assert/strict";
import test from "node:test";
import { cubicSaddleLevel, intervalsWhere, quadLevel } from "../lib/convex/levels.ts";
import { cubicSaddle, hessian, quadForm } from "../lib/convex/models.ts";

const onLevel = (pieces, f, c, tol = 1e-7) => {
  for (const p of pieces)
    for (let k = 0; k <= 20; k++) {
      const t = p.domain[0] + ((p.domain[1] - p.domain[0]) * k) / 20;
      const v = f(p.xy(t));
      assert.ok(Math.abs(v - c) < tol * Math.max(1, Math.abs(c)), `value ${v} vs level ${c}`);
    }
};

test("quadratic levels lie on ½xᵀHx = c in every regime", () => {
  for (const [l1, l2] of [
    [1, 2],
    [0, 2],
    [-1, 2],
    [-1, -2],
    [5, -1],
  ])
    for (const c of [-2, -0.5, 0, 0.5, 2]) {
      const th = 0.6;
      const H = hessian(l1, l2, th);
      onLevel(quadLevel(l1, l2, th, c), (x) => 0.5 * quadForm(H, x), c);
    }
});

test("quadratic level counts", () => {
  assert.equal(quadLevel(1, 2, 0, 1).length, 1); // ellipse
  assert.equal(quadLevel(1, 2, 0, -1).length, 0); // empty
  assert.equal(quadLevel(-1, 2, 0, 1).length, 2); // two hyperbola branches
  assert.equal(quadLevel(-1, 2, 0, 0).length, 2); // asymptotes
  assert.equal(quadLevel(0, 2, 0, 1).length, 2); // two parallel lines
  assert.equal(quadLevel(0, 0, 0, 1).length, 0);
});

test("cubic saddle levels and their intervals", () => {
  for (const c of [-2.5, -1, 0, 1.5, 3]) onLevel(cubicSaddleLevel(c, -3, 3), cubicSaddle, c, 1e-6);
  // x³ - 3x ≤ 2 holds on [-3, 2]: the root x = 2 and the double root x = -1 (tangent, stays ≥ 0)
  const iv = intervalsWhere((x) => 2 - (x ** 3 - 3 * x), -3, 3);
  assert.equal(iv.length, 1);
  assert.ok(Math.abs(iv[0][1] - 2) < 1e-9);
});
