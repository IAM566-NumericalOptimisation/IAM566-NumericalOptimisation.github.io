"use client";

import { LaTeX, Line, Plot, Point, Polygon, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex } from "@/components/kit";
import { boundOnInterval, q3, q3bound, q3grad, signOf, texNum, type V2 } from "@/lib/convex/models";

// CF-07. How does a tangent certify the minimum of the objective?

type View = "interval" | "cone";

const STEPS = [
  "The tangent h_a at the base point a.",
  "Minimize the tangent over the feasible interval [1, 3]: its slope 2a > 0, so at x = 1.",
  "That minimum L(a) = 2a − a² is below the true optimum f* = 1.",
  "Any feasible x̄ gives an upper bound U = f(x̄).",
  "Together: L ≤ f* ≤ U, and U − L bounds the suboptimality of x̄.",
];
const LAST = STEPS.length - 1;
const DASHDOT = { strokeDasharray: "9 4 2 4" };

// level curves of x1² + x1x2 + x2²: with u = (x1+x2)/√2, v = (x1−x2)/√2 it is 1.5u² + 0.5v²
const ellipse = (c: number) => (th: number): V2 => {
  const u = Math.sqrt(c / 1.5) * Math.cos(th);
  const v = Math.sqrt(c / 0.5) * Math.sin(th);
  return [(u + v) / Math.SQRT2, (u - v) / Math.SQRT2];
};

export function LowerBoundFigure() {
  const [view, setView] = useState<View>("interval");
  const [a, setA] = useState(2);
  const [xbar, setXbar] = useState(2.5);
  const [step, setStep] = useState(LAST);
  const [b, setB] = useState<V2>([1, 1]);
  const [phi, setPhi] = useState(200); // degrees
  const reset = () => {
    setA(2);
    setXbar(2.5);
    setStep(LAST);
    setB([1, 1]);
    setPhi(200);
  };

  /* ---------------- 1D: x² on [1, 3] ---------------- */
  const L = boundOnInterval(a);
  const U = xbar * xbar;
  const h = (x: number) => 2 * a * x - a * a;

  /* ---------------- 2D: x1² + x1x2 + x2² on x ≥ (1,1) ---------------- */
  const g = q3grad(b);
  const fb = q3(b);
  const bound = q3bound(b);
  const rad = (phi * Math.PI) / 180;
  const d: V2 = [Math.cos(rad), Math.sin(rad)];
  const clean = (v: number) => (Math.abs(v) < 1e-12 ? 0 : v);
  d[0] = clean(d[0]);
  d[1] = clean(d[1]);
  const slope = g[0] * d[0] + g[1] * d[1];
  // a direction is feasible at b when small steps stay in C: needs d1 ≥ 0 if b1 = 1 and d2 ≥ 0 if b2 = 1
  const onX = Math.abs(b[0] - 1) < 1e-12;
  const onY = Math.abs(b[1] - 1) < 1e-12;
  const feasible = (!onX || d[0] >= 0) && (!onY || d[1] >= 0);
  const slopeSign = signOf(slope);
  const scale = 0.18; // the gradient arrow is drawn at 0.18 of its length
  const R = 0.9; // the direction arrow's length on screen
  const X2: V2 = [-0.4, 4.6];
  const Y2: V2 = [-0.4, 3.6];
  const FAR = 100; // C is unbounded: draw it far past any window edge

  // the cone of feasible directions at b, drawn as a wedge of radius 0.7
  const wedge: V2[] = (() => {
    const lo = onY ? 0 : onX ? -90 : 0;
    const hi = onX ? (onY ? 90 : 90) : onY ? 180 : 360;
    if (!onX && !onY) return [];
    const pts: V2[] = [b];
    for (let k = 0; k <= 24; k++) {
      const th = ((lo + ((hi - lo) * k) / 24) * Math.PI) / 180;
      pts.push([b[0] + 0.7 * Math.cos(th), b[1] + 0.7 * Math.sin(th)]);
    }
    return pts;
  })();

  return (
    <Stage
      hint={view === "interval" ? "move a and x̄" : "choose the base point and a direction"}
      controls={
        <>
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "interval", tex: "x^2 \\text{ on } [1,3]" },
              { value: "cone", tex: "x_1^2+x_1x_2+x_2^2,\\ x\\ge(1,1)" },
            ]}
          />
          {view === "interval" ? (
            <>
              <Slider tex="a" value={a} min={1} max={3} step={0.05} onChange={setA} show={texNum(a, 2)} />
              <Slider tex="\bar x" value={xbar} min={1} max={3} step={0.05} onChange={setXbar} show={texNum(xbar, 2)} />
              <Action onClick={() => setA(2)} pressed={a === 2}>
                <Tex tex="a=2" />
              </Action>
              <Action onClick={() => setA(1)} pressed={a === 1}>
                <Tex tex="a=1" />
              </Action>
              <Stepper steps={STEPS} step={step} onStep={setStep} />
            </>
          ) : (
            <>
              <Action onClick={() => setB([2, 1])} pressed={b[0] === 2 && b[1] === 1}>
                Base <Tex tex="(2,1)" />
              </Action>
              <Action onClick={() => setB([1, 1])} pressed={b[0] === 1 && b[1] === 1}>
                Base <Tex tex="(1,1)" />
              </Action>
              <Slider tex="b_1" value={b[0]} min={1} max={3} step={0.05} onChange={(v) => setB([v, b[1]])} show={texNum(b[0], 2)} />
              <Slider tex="b_2" value={b[1]} min={1} max={3} step={0.05} onChange={(v) => setB([b[0], v])} show={texNum(b[1], 2)} />
              <Slider tex="\varphi" value={phi} min={0} max={355} step={5} onChange={setPhi} show={`${phi}^\\circ`} />
            </>
          )}
          <Action onClick={reset}>Reset</Action>
        </>
      }
      readout={
        view === "interval" ? (
          <>
            <Readout
              tex={`h_a(x)=2ax-a^2,\\qquad L(a)=\\min_{[1,3]}h_a = 2a-a^2 = ${texNum(L)}\\ \\le\\ f^*=1\\ \\le\\ U=\\bar x^2=${texNum(U)}`}
              items={[
                { label: "lower bound L", tex: texNum(L), tone: "copper" },
                { label: "optimum f*", tex: "1", tone: "teal" },
                { label: "upper bound U", tex: texNum(U), tone: "blue" },
                { label: "U − L", tex: texNum(U - L) },
              ]}
            />
          </>
        ) : (
          <>
            <Readout
              tex={`\\nabla f(b)=(${texNum(g[0])},\\ ${texNum(g[1])}),\\quad h_b(x)=${texNum(fb)}+${texNum(g[0])}(x_1-${texNum(b[0])})+${texNum(g[1])}(x_2-${texNum(b[1])}),\\quad \\inf_C h_b=${texNum(bound)}\\le f^*=3`}
              items={[
                { label: "f(b)", tex: texNum(fb), tone: "blue" },
                { label: "tangent bound", tex: texNum(bound), tone: "copper" },
                { label: "direction d", tex: `(${texNum(d[0])},\\ ${texNum(d[1])})` },
                { label: "∇f(b)ᵀd", tex: texNum(slope), tone: slopeSign === "negative" ? undefined : "teal" },
              ]}
            />
          </>
        )
      }
      caption={
        <>
          <strong>How does a tangent certify the minimum of the objective?</strong>{" "}
          {view === "interval" ? (
            <>
              The violet tangent at <Tex tex="a" /> lies under <Tex tex="x^2" /> everywhere, so its minimum over the feasible interval (copper) is a lower bound on{" "}
              <Tex tex="f^*" />. A feasible <Tex tex="\bar x" /> gives an upper bound. The base point <Tex tex="a" /> and the candidate <Tex tex="\bar x" /> play different
              roles: at <Tex tex="a=2" /> the bound is <Tex tex="0" />, at <Tex tex="a=1" /> it is <Tex tex="1" /> and exact.
            </>
          ) : (
            <>
              Teal is <Tex tex="C=\{x_1\ge1,\ x_2\ge1\}" />; it continues beyond the window, whose edges are not constraints. The ink arrow is{" "}
              <Tex tex="\nabla f(b)" /> (drawn shortened), the copper arrow a direction <Tex tex="d" /> (red and dashed when it is infeasible), and the light wedge the feasible directions at a boundary
              point. At <Tex tex="(1,1)" /> the gradient <Tex tex="(3,3)" /> is not zero, yet it makes a nonnegative inner product with every feasible direction.
              A descent direction that leaves <Tex tex="C" /> proves nothing.
            </>
          )}
        </>
      }
    >
      {view === "interval" ? (
        <Plane x={[-0.6, 4.3]} y={[-2.2, 9.8]} height={400} stretch>
          {/* the feasible interval */}
          <Polygon
            points={[
              [1, -2.2],
              [3, -2.2],
              [3, 9.8],
              [1, 9.8],
            ]}
            color={C.teal}
            fillOpacity={0.07}
            strokeOpacity={0}
          />
          <Line.Segment point1={[1, 0]} point2={[3, 0]} color={C.teal} weight={6} opacity={0.6} />
          <Plot.OfX y={(x) => x * x} color={C.blue} weight={3} />
          <Plot.OfX y={h} color={C.violet} weight={2.2} svgPathProps={DASHDOT} />
          <Point x={a} y={a * a} color={C.ink} />
          <LaTeX at={[a - 0.15, a * a + 0.6]} tex="a" color={C.ink} />
          {step >= 1 ? (
            <>
              <Point x={1} y={L} color={C.copper} />
              <LaTeX at={[0.45, L]} tex="L" color={C.copper} />
            </>
          ) : null}
          {step >= 2 ? (
            <>
              <Point x={1} y={1} color={C.teal} />
              <LaTeX at={[0.5, 1.5]} tex="f^*=1" color={C.teal} />
            </>
          ) : null}
          {step >= 3 ? (
            <>
              <Point x={xbar} y={U} color={C.blue} />
              <Line.Segment point1={[xbar, U]} point2={[3.5, U]} color={C.blue} weight={1} style="dashed" opacity={0.6} />
              <LaTeX at={[xbar - 0.2, U + 0.5]} tex="\bar x" color={C.blue} />
            </>
          ) : null}
          {step >= 4 ? (
            <>
              <Line.Segment point1={[1, L]} point2={[3.5, L]} color={C.copper} weight={1} style="dashed" opacity={0.6} />
              <Line.Segment point1={[1, 1]} point2={[3.5, 1]} color={C.teal} weight={1} style="dashed" opacity={0.6} />
              <Line.Segment point1={[3.5, L]} point2={[3.5, U]} color={C.ink} weight={3} />
              <Point x={3.5} y={1} color={C.teal} svgCircleProps={{ r: 4 }} />
              <LaTeX at={[3.72, (L + U) / 2]} tex="U-L" color={C.ink} />
            </>
          ) : null}
        </Plane>
      ) : (
        <Plane x={X2} y={Y2} height={400}>
          <Polygon
            points={[
              [1, 1],
              [FAR, 1],
              [FAR, FAR],
              [1, FAR],
            ]}
            color={C.teal}
            fillOpacity={0.12}
            strokeOpacity={0}
          />
          <Line.Segment point1={[1, 1]} point2={[FAR, 1]} color={C.teal} weight={2.5} />
          <Line.Segment point1={[1, 1]} point2={[1, FAR]} color={C.teal} weight={2.5} />
          <LaTeX at={[3.9, 3.25]} tex="C" color={C.teal} />
          {[3, 7, 12].map((c) => (
            <Plot.Parametric key={c} xy={ellipse(c)} domain={[0, 2 * Math.PI]} color={C.faint} weight={1} opacity={0.7} />
          ))}
          <LaTeX at={[-0.05, 2.3]} tex="f=3" color={C.faint} />
          {wedge.length ? <Polygon points={wedge} color={C.teal} fillOpacity={0.18} strokeOpacity={0} /> : null}
          <Vector tail={b} tip={[b[0] + scale * g[0], b[1] + scale * g[1]]} color={C.ink} weight={2.5} />
          <LaTeX at={[b[0] + scale * g[0] + 0.3, b[1] + scale * g[1] + 0.12]} tex="\nabla f(b)" color={C.ink} />
          <Vector tail={b} tip={[b[0] + R * d[0], b[1] + R * d[1]]} color={feasible ? C.copper : C.red} weight={3} style={feasible ? "solid" : "dashed"} />
          <LaTeX at={[b[0] + 1.15 * R * d[0], b[1] + 1.15 * R * d[1]]} tex="d" color={feasible ? C.copper : C.red} />
          <Point x={b[0]} y={b[1]} color={C.blue} />
          <LaTeX at={[b[0] - 0.22, b[1] - 0.25]} tex="b" color={C.blue} />
        </Plane>
      )}
    </Stage>
  );
}
