"use client";

import { LaTeX, Line, MovablePoint, Plot, Point } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex } from "@/components/kit";
import { FN1, chord, signOf, squareGap, texNum } from "@/lib/convex/models";

// CF-01. Which two heights are compared at the same input point?

type Id = "sq" | "quart" | "abs" | "cube" | "affine" | "sqrtabs";

const START: Record<Id, { a: number; b: number; t: number }> = {
  sq: { a: -1, b: 2, t: 0.5 },
  quart: { a: -1, b: 1.5, t: 0.5 },
  abs: { a: -2, b: 1.5, t: 0.5 },
  cube: { a: -2, b: 0, t: 0.5 },
  affine: { a: -2, b: 2, t: 0.5 },
  sqrtabs: { a: 0, b: 4, t: 0.5 },
};

const STEPS = [
  "The graph of f.",
  "Two endpoints a, b on the graph.",
  "The mixed input z = (1−t)a + tb on the segment [a, b].",
  "The chord from (a, f(a)) to (b, f(b)).",
  "The two heights over the same z: f(z) on the graph, ℓ on the chord.",
  "The signed gap G = ℓ − f(z).",
];
const LAST = STEPS.length - 1;

const round = (v: number, step = 0.05) => Math.round(v / step) * step;

export function ChordGapFigure() {
  const [id, setId] = useState<Id>("sq");
  const [{ a, b, t }, setState] = useState(START.sq);
  const [step, setStep] = useState(LAST);
  const fn = FN1[id];
  const { x: vx, y: vy } = fn.view;
  const clampX = (v: number) => Math.min(vx[1] - 0.2, Math.max(vx[0] + 0.2, v));

  const set = (patch: Partial<{ a: number; b: number; t: number }>) => setState((s) => ({ ...s, ...patch }));
  const choose = (next: Id, at?: { a: number; b: number; t: number }) => {
    setId(next);
    setState(at ?? START[next]);
  };

  const c = chord(fn.f, a, b, t);
  const fa = fn.f(a);
  const fb = fn.f(b);
  const sign = signOf(c.gap, 1e-9);
  const gapColor = sign === "negative" ? C.red : C.teal;

  // label offsets in plot units
  const dy = (vy[1] - vy[0]) * 0.06;
  const dx = (vx[1] - vx[0]) * 0.04;
  const base = Math.max(vy[0] + dy * 0.6, Math.min(0, vy[1]));

  return (
    <Stage
      hint="drag the endpoints, or use the sliders"
      controls={
        <>
          <Segmented
            label="Function"
            value={id}
            onChange={(v) => choose(v)}
            options={[
              { value: "sq", tex: "x^2" },
              { value: "quart", tex: "x^4" },
              { value: "abs", tex: "|x|" },
              { value: "cube", tex: "x^3" },
              { value: "affine", tex: "\\tfrac12x+1" },
              { value: "sqrtabs", tex: "\\sqrt{|x|}" },
            ]}
          />
          <Slider tex="a" value={a} min={vx[0] + 0.2} max={vx[1] - 0.2} step={0.05} onChange={(v) => set({ a: v })} show={texNum(a, 2)} />
          <Slider tex="b" value={b} min={vx[0] + 0.2} max={vx[1] - 0.2} step={0.05} onChange={(v) => set({ b: v })} show={texNum(b, 2)} />
          <Slider tex="t" value={t} min={0} max={1} step={0.01} onChange={(v) => set({ t: v })} show={texNum(t, 2)} />
          <Stepper steps={STEPS} step={step} onStep={setStep} />
          <Action onClick={() => choose("cube", { a: -2, b: 0, t: 0.5 })}>
            <Tex tex="x^3" />: a counterexample
          </Action>
          <Action onClick={() => choose("sqrtabs", { a: 0, b: 4, t: 0.5 })}>
            <Tex tex="\sqrt{|x|}" />: a counterexample
          </Action>
          <Action onClick={() => choose("abs", { a: 1, b: 2, t: 0.5 })}>
            <Tex tex="|x|" />: equality, not strict
          </Action>
          <Action
            onClick={() => {
              choose("sq");
              setStep(LAST);
            }}
          >
            Reset
          </Action>
        </>
      }
      readout={
        <>
          <Readout
            tex={
              step < 2
                ? `f(x) = ${fn.tex},\\qquad a = ${texNum(a, 2)},\\ b = ${texNum(b, 2)}`
                : step < 4
                  ? `z = (1-t)a + tb = ${texNum(c.z)}`
                  : `\\underbrace{(1-t)f(a)+tf(b)}_{\\ell\\, =\\, ${texNum(c.ell)}} \\;-\\; \\underbrace{f(z)}_{${texNum(c.fz)}} \\;=\\; G = ${step >= 5 ? texNum(c.gap) : "\\;?"}`
            }
            items={[
              { label: "input z", tex: texNum(c.z) },
              { label: "graph f(z)", tex: texNum(c.fz), tone: "blue" },
              { label: "chord ℓ", tex: texNum(c.ell), tone: "copper" },
              ...(step >= 5 ? [{ label: "gap G", tex: texNum(c.gap), tone: sign === "negative" ? undefined : ("teal" as const) }] : []),
              ...(id === "sq" ? [{ label: "exact t(1−t)(a−b)²", tex: texNum(squareGap(a, b, t)) }] : []),
            ]}
          />
        </>
      }
      caption={
        <>
          <strong>Which two heights are compared at the same input?</strong> Over the mixed input <Tex tex="z=(1-t)a+tb" /> the blue point is the value{" "}
          <Tex tex="f(z)" /> and the copper point is the interpolated height <Tex tex="\ell=(1-t)f(a)+tf(b)" /> on the chord. Convexity asks <Tex tex="G=\ell-f(z)\ge0" /> for
          every triple. One negative gap (red) disproves convexity; nonnegative gaps at the triples you try do not prove it, which is why the analytic
          classification comes from the text, not from this picture.
        </>
      }
    >
      <Plane x={vx} y={vy} height={400} stretch>
        <Plot.OfX y={fn.f} color={C.blue} weight={3} />
        <LaTeX at={[vx[1] - 2.2 * dx, Math.min(vy[1] - dy, fn.f(vx[1] - 2.2 * dx) + dy)]} tex={`f`} color={C.blue} />

        {step >= 2 ? (
          <>
            {/* the input segment [a, b] on the axis, and z on it */}
            <Line.Segment point1={[a, base]} point2={[b, base]} color={C.faint} weight={4} opacity={0.6} />
            <Point x={c.z} y={base} color={C.ink} svgCircleProps={{ r: 5 }} />
            <LaTeX at={[c.z, base - dy * 0.9]} tex="z" color={C.ink} />
          </>
        ) : null}

        {step >= 3 ? (
          <>
            <Line.Segment point1={[a, fa]} point2={[b, fb]} color={C.copper} weight={2.5} style="dashed" />
            <LaTeX at={[(a + 3 * b) / 4 - dx * 1.8, (fa + 3 * fb) / 4 + dy * 0.9]} tex="\text{chord}" color={C.copper} />
          </>
        ) : null}

        {step >= 4 ? (
          <>
            <Line.Segment point1={[c.z, base]} point2={[c.z, Math.max(c.fz, c.ell)]} color={C.faint} weight={1} style="dashed" opacity={0.7} />
            <Line.Segment point1={[c.z, c.fz]} point2={[vx[0], c.fz]} color={C.blue} weight={1} style="dashed" opacity={0.5} />
            <Line.Segment point1={[c.z, c.ell]} point2={[vx[0], c.ell]} color={C.copper} weight={1} style="dashed" opacity={0.5} />
            <Point x={c.z} y={c.fz} color={C.blue} svgCircleProps={{ r: 6 }} />
            <Point x={c.z} y={c.ell} color={C.copper} svgCircleProps={{ r: 6 }} />
            <LaTeX at={[c.z + dx * 1.6, c.fz - dy * 0.6]} tex="f(z)" color={C.blue} />
            <LaTeX at={[c.z - dx * 1.4, c.ell + dy * 0.7]} tex="\ell" color={C.copper} />
          </>
        ) : null}

        {step >= 5 && Math.abs(c.gap) > 1e-9 ? (
          <>
            <Line.Segment point1={[c.z + dx * 0.35, c.fz]} point2={[c.z + dx * 0.35, c.ell]} color={gapColor} weight={4} />
            <LaTeX at={[c.z + dx * 1.5, (c.fz + c.ell) / 2]} tex={sign === "negative" ? "G<0" : "G"} color={gapColor} />
          </>
        ) : null}

        {step >= 1 ? (
          <>
            <MovablePoint point={[a, fa]} onMove={([x]) => set({ a: round(clampX(x)) })} constrain={([x]) => [round(clampX(x)), fn.f(round(clampX(x)))]} color={C.ink} />
            <MovablePoint point={[b, fb]} onMove={([x]) => set({ b: round(clampX(x)) })} constrain={([x]) => [round(clampX(x)), fn.f(round(clampX(x)))]} color={C.ink} />
            <LaTeX at={[a - dx, fa + dy]} tex="a" color={C.ink} />
            <LaTeX at={[b + dx, fb + dy]} tex="b" color={C.ink} />
          </>
        ) : null}
      </Plane>
    </Stage>
  );
}
