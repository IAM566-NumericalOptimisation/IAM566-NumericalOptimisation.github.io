"use client";

import { LaTeX, Line, Plot, Point, Polygon, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex } from "@/components/kit";
import { EPI, chord, texNum, type V2 } from "@/lib/convex/models";

// CF-04. How does a function inequality become a statement about set membership?

type Id = "sq" | "cube" | "vee" | "capped";
type Mode = "graph" | "epi" | "hyp";
type P = { a: number; u: number; b: number; v: number; t: number };

const VIEW: Record<Id, { x: V2; y: V2 }> = {
  sq: { x: [-2.6, 2.6], y: [-1.5, 5.2] },
  cube: { x: [-2.1, 2.1], y: [-4.6, 4.6] },
  vee: { x: [-0.7, 3.7], y: [-1.1, 3.3] },
  capped: { x: [-0.7, 3.7], y: [-1.1, 3.3] },
};

const START: Record<Id, P> = {
  sq: { a: -1.5, u: 0.6, b: 1, v: 1.2, t: 0.5 },
  cube: { a: -1.5, u: 0, b: 0, v: 0, t: 0.5 },
  vee: { a: 0.3, u: 0.4, b: 2.5, v: 0.3, t: 0.5 },
  capped: { a: 1, u: 0, b: 3, v: 0, t: 0.5 },
};

const STEPS = [
  "Two points of the set: a, b ∈ C with heights r, s on the correct side of f(a), f(b).",
  "Mix them: P_t = (1−t)A + tB.",
  "Domain check: z = (1−t)a + tb lies in C because C is convex.",
  "Height check: compare the mixed height with f(z) through the chord value ℓ.",
];
const LAST = STEPS.length - 1;

const N = 160;

export function EpigraphFigure() {
  const [id, setId] = useState<Id>("sq");
  const [mode, setMode] = useState<Mode>("epi");
  const [p, setP] = useState<P>(START.sq);
  const [step, setStep] = useState(LAST);
  const set = (q: Partial<P>) => setP((s) => ({ ...s, ...q }));
  const choose = (next: Id, at?: P) => {
    setId(next);
    setP(at ?? START[next]);
  };

  const { f, domain } = EPI[id];
  const view = VIEW[id];
  const [d0, d1] = domain;
  // hypograph: offsets go downwards; graph: no offsets
  const sgn = mode === "epi" ? 1 : mode === "hyp" ? -1 : 0;
  const A: V2 = [p.a, f(p.a) + sgn * p.u];
  const B: V2 = [p.b, f(p.b) + sgn * p.v];
  const Pt: V2 = [(1 - p.t) * A[0] + p.t * B[0], (1 - p.t) * A[1] + p.t * B[1]];
  const fz = f(Pt[0]);
  const ch = chord(f, p.a, p.b, p.t); // ℓ = (1-t)f(a) + t f(b)
  // margin ≥ 0 means P_t is in the set (graph: = 0)
  const margin = mode === "epi" ? Pt[1] - fz : mode === "hyp" ? fz - Pt[1] : -Math.abs(Pt[1] - fz);
  const inside = margin >= -1e-9;
  const setTex = mode === "epi" ? "\\operatorname{epi} f" : mode === "hyp" ? "\\operatorname{hyp} f" : "\\operatorname{graph} f";

  // the drawn region, over the finite window only
  const xs = Array.from({ length: N + 1 }, (_, i) => d0 + ((d1 - d0) * i) / N);
  const curve: V2[] = xs.map((x) => [x, f(x)]);
  const top = view.y[1] - 0.15;
  const bottom = view.y[0] + 0.15;
  const clampY = (y: number) => Math.max(bottom, Math.min(top, y));
  const region: V2[] | null =
    mode === "epi"
      ? [...curve.map(([x, y]) => [x, clampY(y)] as V2), [d1, top], [d0, top]]
      : mode === "hyp"
        ? [...curve.map(([x, y]) => [x, clampY(y)] as V2), [d1, bottom], [d0, bottom]]
        : null;
  const cx = (view.x[1] - view.x[0]) * 0.018;
  const cy = (view.y[1] - view.y[0]) * 0.03;
  const arrowsAt = [d0 + (d1 - d0) * 0.35, d0 + (d1 - d0) * 0.65, d0 + (d1 - d0) * 0.92];

  const rel = mode === "hyp" ? "\\le" : "\\ge";
  const heightTex = (() => {
    const H = Pt[1];
    const first = mode === "epi" ? H >= ch.ell - 1e-9 : H <= ch.ell + 1e-9;
    const secondHolds = mode === "epi" ? ch.ell >= fz - 1e-9 : ch.ell <= fz + 1e-9;
    const r1 = first ? rel : mode === "hyp" ? ">" : "<";
    const r2 = secondHolds ? rel : mode === "hyp" ? ">" : "<";
    return `(1-t)r+ts = ${texNum(H)} \\;${r1}\\; \\ell = ${texNum(ch.ell)} \\;${r2}\\; f(z) = ${texNum(fz)}`;
  })();

  return (
    <Stage
      hint="the region is cut off by the window; it continues"
      controls={
        <>
          <Segmented
            label="Function"
            value={id}
            onChange={(v) => choose(v)}
            options={[
              { value: "sq", tex: "x^2" },
              { value: "cube", tex: "x^3" },
              { value: "vee", tex: "|x-1|" },
              { value: "capped", tex: "\\min\\{|x-1|,1\\}" },
            ]}
          />
          <Segmented
            label="Set"
            value={mode}
            onChange={setMode}
            options={[
              { value: "graph", text: "graph" },
              { value: "epi", text: "epigraph" },
              { value: "hyp", text: "hypograph" },
            ]}
          />
          <Slider tex="a" value={p.a} min={d0} max={d1} step={0.05} onChange={(v) => set({ a: v })} show={texNum(p.a, 2)} />
          <Slider tex="b" value={p.b} min={d0} max={d1} step={0.05} onChange={(v) => set({ b: v })} show={texNum(p.b, 2)} />
          {mode !== "graph" ? (
            <>
              <Slider tex="u" value={p.u} min={0} max={2} step={0.05} onChange={(v) => set({ u: v })} show={texNum(p.u, 2)} />
              <Slider tex="v" value={p.v} min={0} max={2} step={0.05} onChange={(v) => set({ v: v })} show={texNum(p.v, 2)} />
            </>
          ) : null}
          <Slider tex="t" value={p.t} min={0} max={1} step={0.01} onChange={(v) => set({ t: v })} show={texNum(p.t, 2)} />
          <Stepper steps={STEPS} step={step} onStep={setStep} />
          <Action onClick={() => set({ u: 0, v: 0 })}>
            Reverse proof: <Tex tex="u=v=0" />
          </Action>
          <Action
            onClick={() => {
              choose("capped", START.capped);
              setMode("epi");
              setStep(LAST);
            }}
          >
            Capped V: <Tex tex="(1,0),(3,1)" />
          </Action>
          <Action
            onClick={() => {
              choose("sq");
              setMode("epi");
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
              step <= 1
                ? `A = (${texNum(A[0])},\\,${texNum(A[1])}),\\quad B = (${texNum(B[0])},\\,${texNum(B[1])}),\\quad P_t = (${texNum(Pt[0])},\\,${texNum(Pt[1])})`
                : step === 2
                  ? `z = (1-t)a+tb = ${texNum(Pt[0])} \\in [${texNum(d0)}, ${texNum(d1)}] = C`
                  : mode === "graph"
                    ? `P_{t,r} - f(P_{t,x}) = ${texNum(Pt[1])} - ${texNum(fz)} = ${texNum(Pt[1] - fz)}`
                    : heightTex
            }
            items={[
              { label: "domain", tex: `z = ${texNum(Pt[0])} \\in C\\ \\checkmark` },
              { label: "membership margin", tex: mode === "hyp" ? `f(P_{t,x}) - P_{t,r} = ${texNum(margin)}` : `P_{t,r} - f(P_{t,x}) = ${texNum(mode === "graph" ? Pt[1] - fz : margin)}`, tone: inside ? "teal" : undefined },
              { label: "chord gap ℓ − f(z)", tex: texNum(ch.gap), tone: "copper" },
            ]}
          />
        </>
      }
      caption={
        <>
          <strong>How does a function inequality become set membership?</strong> The epigraph is everything on or above the graph over the domain{" "}
          <Tex tex="C" />, the hypograph everything on or below it; both are unbounded, so the shading stops only at the window. Mixing two epigraph points{" "}
          <Tex tex="A=(a,f(a)+u)" />, <Tex tex="B=(b,f(b)+v)" /> passes two separate checks: the base point stays in <Tex tex="C" /> because{" "}
          <Tex tex="C" /> is convex, and the mixed height stays above <Tex tex="f(z)" /> because it is above the chord value <Tex tex="\ell" />, which is
          above <Tex tex="f(z)" /> exactly when the chord inequality holds. With <Tex tex="u=v=0" /> the margin is the chord gap itself, which is the
          converse direction of the proof. For the capped V, <Tex tex="(1,0)" /> and <Tex tex="(3,1)" /> are in the epigraph but their midpoint{" "}
          <Tex tex="(2,\tfrac12)" /> is not, since <Tex tex="g(2)=1" />.
        </>
      }
    >
      <Plane x={view.x} y={view.y} height={380} stretch>
        {region ? <Polygon points={region} color={C.teal} fillOpacity={0.14} weight={0} strokeOpacity={0} /> : null}
        {region
          ? arrowsAt.map((x) =>
              mode === "epi" ? (
                <Vector key={x} tail={[x, top - 0.7]} tip={[x, top - 0.05]} color={C.teal} weight={1.5} opacity={0.7} />
              ) : (
                <Vector key={x} tail={[x, bottom + 0.7]} tip={[x, bottom + 0.05]} color={C.teal} weight={1.5} opacity={0.7} />
              ),
            )
          : null}
        {id === "vee" || id === "capped" ? (
          <>
            <Line.Segment point1={[0, view.y[0]]} point2={[0, view.y[1]]} color={C.faint} weight={1} style="dashed" />
            <Line.Segment point1={[3, view.y[0]]} point2={[3, view.y[1]]} color={C.faint} weight={1} style="dashed" />
          </>
        ) : null}
        <Plot.OfX y={f} domain={domain} color={C.blue} weight={3} />
        <LaTeX at={[d1 - (d1 - d0) * 0.07, Math.min(top - 0.3, f(d1 - (d1 - d0) * 0.07)) + 0.35]} tex="f" color={C.blue} />
        {region ? <LaTeX at={[(d0 + d1) / 2 + (mode === "epi" ? 0 : 0.2), mode === "epi" ? top - 1.0 : bottom + 1.0]} tex={setTex} color={C.teal} /> : null}

        {/* the offsets from the graph to A and B */}
        {mode !== "graph" ? (
          <>
            <Line.Segment point1={[p.a, f(p.a)]} point2={A} color={C.faint} weight={1.5} style="dashed" />
            <Line.Segment point1={[p.b, f(p.b)]} point2={B} color={C.faint} weight={1.5} style="dashed" />
          </>
        ) : null}
        {step >= 1 ? <Line.Segment point1={A} point2={B} color={C.ink} weight={2} opacity={0.75} /> : null}
        {step >= 3 && mode !== "graph" ? <Line.Segment point1={[p.a, f(p.a)]} point2={[p.b, f(p.b)]} color={C.copper} weight={2} style="dashed" /> : null}
        {step >= 2 ? (
          <>
            <Line.Segment point1={[Pt[0], view.y[0]]} point2={[Pt[0], Pt[1]]} color={C.faint} weight={1} style="dashed" opacity={0.7} />
            <Point x={Pt[0]} y={fz} color={C.blue} svgCircleProps={{ r: 4 }} />
          </>
        ) : null}
        {step >= 3 && mode !== "graph" && Math.abs(ch.ell - Pt[1]) > 1e-9 ? (
          <>
            <Point x={Pt[0]} y={ch.ell} color={C.copper} svgCircleProps={{ r: 4 }} />
            <LaTeX at={[Pt[0] - cx * 2.2, ch.ell]} tex="\ell" color={C.copper} />
          </>
        ) : null}
        <Point x={A[0]} y={A[1]} color={C.ink} />
        <Point x={B[0]} y={B[1]} color={C.ink} />
        <LaTeX at={[A[0] - 0.18, A[1] + 0.3]} tex="A" color={C.ink} />
        <LaTeX at={[B[0] + 0.18, B[1] + 0.3]} tex="B" color={C.ink} />
        {step >= 1 ? (
          <>
            {inside || step < 3 ? <Point x={Pt[0]} y={Pt[1]} color={inside ? C.teal : C.red} svgCircleProps={{ r: 6.5 }} /> : null}
            {!inside && step >= 3 ? (
              <>
                <Line.Segment point1={[Pt[0] - cx, Pt[1] - cy]} point2={[Pt[0] + cx, Pt[1] + cy]} color={C.red} weight={2.5} />
                <Line.Segment point1={[Pt[0] - cx, Pt[1] + cy]} point2={[Pt[0] + cx, Pt[1] - cy]} color={C.red} weight={2.5} />
              </>
            ) : null}
            <LaTeX at={[Pt[0] + 0.25, Pt[1] + (mode === "hyp" ? -0.35 : 0.35)]} tex="P_t" color={inside ? C.teal : C.red} />
          </>
        ) : null}
      </Plane>
    </Stage>
  );
}
