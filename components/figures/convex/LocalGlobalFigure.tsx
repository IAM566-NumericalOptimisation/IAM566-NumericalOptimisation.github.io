"use client";

import { Circle, LaTeX, Line, Plot, Point, Polygon } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex } from "@/components/kit";
import { cubic, texNum, tInside } from "@/lib/convex/models";

// CF-02. If a better point exists far away, why is there a better point nearby?

type View = "proof" | "set" | "objective";
type V = [number, number];

const STEPS = [
  "x* is a local minimizer: no feasible point within distance δ is better.",
  "Assume, for contradiction, that some feasible y has f(y) < f(x*).",
  "C is convex, so the whole segment from x* to y is feasible.",
  "Mix: z_t = x* + t(y − x*) with 0 < t < 1.",
  "Then ‖z_t − x*‖ = t‖y − x*‖, which is below δ once t is small.",
  "f is convex: f(z_t) ≤ (1−t)f(x*) + t f(y) < f(x*). Contradiction.",
];
const LAST = STEPS.length - 1;

// the schematic: x* at the origin, the allegedly better y, and a convex feasible region around both
const XS: V = [0, 0];
const Y: V = [4, 1.5];
const DIST = Math.hypot(Y[0] - XS[0], Y[1] - XS[1]);
const REGION: V[] = [
  [-1.2, -1.3],
  [2.6, -1.4],
  [4.9, 0.6],
  [4.6, 2.3],
  [1.2, 2.2],
  [-1.3, 0.9],
];
// schematic values: only the two values the proof talks about, no invented graph
const FX = 2;
const FY = 1;

const START = { delta: 1, t: 0.6, s: -0.5 };

export function LocalGlobalFigure() {
  const [view, setView] = useState<View>("proof");
  const [{ delta, t, s }, setState] = useState(START);
  const [step, setStep] = useState(LAST);
  const set = (p: Partial<typeof START>) => setState((v) => ({ ...v, ...p }));
  const reset = () => {
    setState(START);
    setStep(LAST);
  };

  const z: V = [XS[0] + t * (Y[0] - XS[0]), XS[1] + t * (Y[1] - XS[1])];
  const dz = t * DIST;
  const inside = dz < delta;
  const bound = (1 - t) * FX + t * FY;
  const tMax = tInside(DIST, delta);

  const controls = (
    <>
      <Segmented
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "proof", text: "The proof" },
          { value: "set", text: "Nonconvex set" },
          { value: "objective", text: "Nonconvex objective" },
        ]}
      />
      {view === "proof" ? (
        <>
          <Slider tex="\delta" value={delta} min={0.3} max={2} step={0.05} onChange={(v) => set({ delta: v })} />
          <Slider tex="t" value={t} min={0} max={1} step={0.01} onChange={(v) => set({ t: v })} />
          <Stepper steps={STEPS} step={step} onStep={setStep} />
          <Action onClick={() => set({ t: Math.floor(tMax * 0.9 * 100) / 100 })}>
            Choose <Tex tex="t < \delta/\|y-x^*\|" />
          </Action>
        </>
      ) : null}
      {view === "set" ? <Slider tex="s" value={s} min={-3} max={4} step={0.05} onChange={(v) => set({ s: v })} /> : null}
      <Action onClick={reset}>Reset</Action>
    </>
  );

  if (view === "proof") {
    return (
      <Stage
        hint="a schematic: only the assumed values are drawn"
        controls={controls}
        readout={
          <>
            <Readout
              tex={`\\|z_t-x^*\\| = t\\,\\|y-x^*\\| = ${texNum(t, 2)}\\cdot ${texNum(DIST, 3)} = ${texNum(dz, 3)} \\;${inside ? "<" : "\\ge"}\\; \\delta = ${texNum(delta, 2)}`}
              items={[
                { label: "largest useful t", tex: `\\min\\{1,\\delta/\\|y-x^*\\|\\} = ${texNum(tMax, 3)}` },
                { label: "cap on f(z_t)", tex: `(1-t)f(x^*)+tf(y) = ${texNum(bound, 3)}`, tone: "copper" },
                { label: "f(x*)", tex: String(FX), tone: "blue" },
              ]}
            />
          </>
        }
        caption={
          <>
            <strong>If a better point exists far away, why is there a better point nearby?</strong> Left, the input space: the teal region is the
            convex feasible set <Tex tex="C" />, the dashed circle the local-minimality radius <Tex tex="\delta" />. Right, the only values the proof
            uses: <Tex tex="f(x^*)" /> and the value <Tex tex="f(y)<f(x^*)" /> that is assumed for contradiction. Convexity of <Tex tex="f" /> caps{" "}
            <Tex tex="f(z_t)" /> by the copper chord, strictly below <Tex tex="f(x^*)" /> for every <Tex tex="t>0" />. No convex function has such a{" "}
            <Tex tex="y" />, so no graph is drawn: the picture is of the impossible situation the proof rules out.
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <Plane x={[-1.6, 5.2]} y={[-1.8, 2.8]} height={320} grid={false}>
            <Polygon points={REGION} color={C.teal} fillOpacity={0.1} weight={1.5} strokeOpacity={0.6} />
            <LaTeX at={[4.4, -0.9]} tex="C" color={C.teal} />
            <Circle center={XS} radius={delta} color={C.ink} fillOpacity={0.04} strokeStyle="dashed" weight={1.5} />
            <LaTeX at={[-delta * 0.72 - 0.15, -delta * 0.72 - 0.15]} tex="\delta" color={C.ink} />
            <Point x={XS[0]} y={XS[1]} color={C.blue} />
            <LaTeX at={[-0.35, 0.4]} tex="x^*" color={C.blue} />
            {step >= 1 ? (
              <>
                <Point x={Y[0]} y={Y[1]} color={C.red} />
                <LaTeX at={[Y[0] + 0.1, Y[1] + 0.45]} tex="y" color={C.red} />
              </>
            ) : null}
            {step >= 2 ? <Line.Segment point1={XS} point2={Y} color={C.teal} weight={3} /> : null}
            {step >= 3 ? (
              <>
                <Point x={z[0]} y={z[1]} color={step >= 4 && inside && t > 0 ? C.red : C.copper} svgCircleProps={{ r: 6 }} />
                <LaTeX at={[z[0] + 0.15, z[1] - 0.45]} tex="z_t" color={C.ink} />
              </>
            ) : null}
          </Plane>
          <Plane x={[-0.15, 1.3]} y={[-0.3, 2.8]} height={320} grid={false} stretch>
            <Line.Segment point1={[0, 0]} point2={[1.15, 0]} color={C.muted} weight={1} />
            <Line.Segment point1={[0, 0]} point2={[0, 2.6]} color={C.muted} weight={1} />
            <LaTeX at={[1.2, -0.14]} tex="t" color={C.muted} />
            <LaTeX at={[0.03, -0.16]} tex="0" color={C.muted} />
            <LaTeX at={[1, -0.16]} tex="1" color={C.muted} />
            <Line.Segment point1={[0, FX]} point2={[1.15, FX]} color={C.blue} weight={2} />
            <LaTeX at={[0.95, FX + 0.18]} tex="f(x^*)" color={C.blue} />
            <Point x={0} y={FX} color={C.blue} />
            {step >= 1 ? (
              <>
                <Point x={1} y={FY} color={C.red} />
                <LaTeX at={[0.95, FY - 0.28]} tex="f(y)\ \text{(assumed)}" color={C.red} />
              </>
            ) : null}
            {step >= 5 ? (
              <>
                <Line.Segment point1={[0, FX]} point2={[1, FY]} color={C.copper} weight={2.5} style="dashed" />
                <Line.Segment point1={[t, 0]} point2={[t, bound]} color={C.red} weight={6} opacity={0.25} />
                <Point x={t} y={bound} color={C.copper} />
                <LaTeX at={[Math.max(0.3, Math.min(t, 0.85)), bound + 0.42]} tex="f(z_t)\le \text{cap} < f(x^*)" color={C.copper} />
              </>
            ) : null}
          </Plane>
        </div>
      </Stage>
    );
  }

  if (view === "set") {
    const feasible = (x: number) => (x >= -3 && x <= -2) || (x >= 1 && x <= 4);
    const ok = feasible(s);
    return (
      <Stage
        hint="slide s across the gap"
        controls={controls}
        readout={
          <>
            <Readout
              tex={`f(x)=x^2 \\text{ on } C=[-3,-2]\\cup[1,4],\\qquad s = ${texNum(s, 2)},\\ f(s) = ${texNum(s * s, 3)}`}
              items={[
                { label: "local minimizer −2", tex: "f(-2) = 4", tone: "copper" },
                { label: "global minimizer 1", tex: "f(1) = 1", tone: "teal" },
              ]}
            />
          </>
        }
        caption={
          <>
            <strong>What fails when the feasible set is not convex?</strong> The objective <Tex tex="x^2" /> is convex, but <Tex tex="C" /> has two
            pieces. Relative to <Tex tex="C" />, the boundary point <Tex tex="-2" /> is a local minimizer: its feasible neighbours lie to its left and
            are worse. It is not global, since <Tex tex="f(1)=1<4" />. The proof of the theorem would travel along the segment from <Tex tex="-2" />{" "}
            towards <Tex tex="1" />, and that segment leaves <Tex tex="C" />.
          </>
        }
      >
        <Plane x={[-3.8, 4.8]} y={[-2.5, 17.5]} height={360} stretch>
          <Plot.OfX y={(x) => x * x} color={C.faint} weight={1.5} opacity={0.6} />
          <Plot.OfX y={(x) => x * x} domain={[-3, -2]} color={C.blue} weight={3.5} />
          <Plot.OfX y={(x) => x * x} domain={[1, 4]} color={C.blue} weight={3.5} />
          <Line.Segment point1={[-3, 0]} point2={[-2, 0]} color={C.teal} weight={7} opacity={0.6} />
          <Line.Segment point1={[1, 0]} point2={[4, 0]} color={C.teal} weight={7} opacity={0.6} />
          <Line.Segment point1={[-2, 0]} point2={[1, 0]} color={C.red} weight={2} style="dashed" />
          <LaTeX at={[-0.5, -1.4]} tex="\text{infeasible}" color={C.red} />
          <Point x={-2} y={4} color={C.copper} />
          <LaTeX at={[-2.2, 6.3]} tex="\text{local, not global}" color={C.copper} />
          <Point x={1} y={1} color={C.teal} />
          <LaTeX at={[1.9, 2.3]} tex="\text{global}" color={C.teal} />
          <Line.Segment point1={[s, 0]} point2={[s, s * s]} color={C.faint} weight={1} style="dashed" />
          <Point x={s} y={s * s} color={ok ? C.blue : C.faint} />
          <Point x={s} y={0} color={ok ? C.teal : C.red} svgCircleProps={{ r: 6 }} />
          <LaTeX at={[s, -1.4]} tex={ok ? "s" : ""} color={C.ink} />
        </Plane>
      </Stage>
    );
  }

  // nonconvex objective on a convex set
  const marks: { x: number; label: string; color: string; dy: number; dx: number }[] = [
    { x: -3, label: "\\text{global min } f(-3)=-18", color: C.teal, dy: 1.5, dx: 1.55 },
    { x: -1, label: "\\text{local max } f(-1)=2", color: C.muted, dy: 3.2, dx: 0 },
    { x: 1, label: "\\text{local min } f(1)=-2,\\ \\text{not global}", color: C.copper, dy: -3.4, dx: 0.6 },
    { x: 3, label: "f(3)=18", color: C.muted, dy: 0, dx: -0.65 },
  ];
  return (
    <Stage
      controls={controls}
      readout={
        <Readout
          tex="f(x) = x^3-3x \text{ on } [-3,3],\qquad f'(x) = 3x^2-3 = 0 \iff x=\pm1,\qquad f''(x) = 6x"
          items={[
            { label: "local min at 1", tex: "f(1) = -2", tone: "copper" },
            { label: "global min at −3", tex: "f(-3) = -18", tone: "teal" },
            { label: "analytic result", tex: "f''(x)<0 \\text{ for } x<0:\\ \\text{not convex}" },
          ]}
        />
      }
      caption={
        <>
          <strong>What fails when the objective is not convex?</strong> The domain <Tex tex="[-3,3]" /> is convex, but <Tex tex="x^3-3x" /> is not.
          The interior point <Tex tex="1" /> is a local minimizer with value <Tex tex="-2" />, while the boundary point <Tex tex="-3" /> is the global
          minimizer with value <Tex tex="-18" />; relative to the interval it is also a local minimizer. A convex feasible set alone cannot rule out a
          suboptimal local minimum.
        </>
      }
    >
      <Plane x={[-3.8, 3.8]} y={[-21, 21]} height={360} stretch>
        <Line.Segment point1={[-3, 0]} point2={[3, 0]} color={C.teal} weight={7} opacity={0.35} />
        <Plot.OfX y={cubic} domain={[-3, 3]} color={C.blue} weight={3} />
        {marks.map((m) => (
          <g key={m.x}>
            <Point x={m.x} y={cubic(m.x)} color={m.color} />
            <LaTeX at={[m.x + m.dx, cubic(m.x) + m.dy]} tex={m.label} color={m.color} />
          </g>
        ))}
      </Plane>
    </Stage>
  );
}
