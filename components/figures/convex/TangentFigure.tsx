"use client";

import { LaTeX, Line, Plot, Point, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex, useTween } from "@/components/kit";
import { FN1, quotient, signOf, texNum, type V2 } from "@/lib/convex/models";

// CF-06. When does the local Taylor approximation become a global lower bound?

type Mode = "secant" | "support" | "reverse";
type Id = "sq" | "quart" | "cube";

const VIEW: Record<Id, { x: V2; y: V2 }> = {
  sq: { x: [-3, 3.4], y: [-1.5, 6.5] },
  quart: { x: [-1.9, 2.1], y: [-1.2, 5.5] },
  cube: { x: [-2.6, 2.6], y: [-6, 6] },
};

const START = {
  sq: { a: 0.5, b: 2, s: 1, probe: 2.2, x: -2, y: 2, t: 0.25 },
  quart: { a: 0.5, b: 1.5, s: 1, probe: 1.3, x: -1.5, y: 1.5, t: 0.4 },
  cube: { a: 0.5, b: -1.5, s: 1, probe: -1.6, x: -1.5, y: 1.5, t: 0.4 },
} as const;

const STEPS = [
  "Pick x, y and the mixed point z = (1−t)x + ty.",
  "Take the tangent h_z at z itself, not at x or y.",
  "Both endpoints lie on or above it: f(x) ≥ h_z(x), f(y) ≥ h_z(y).",
  "The displacements x − z and y − z point in opposite directions.",
  "Weighted, (1−t)(x−z) + t(y−z) = 0, so the slope terms cancel.",
  "Hence (1−t)f(x) + tf(y) ≥ (1−t)h_z(x) + t·h_z(y) = f(z).",
];
const LAST = STEPS.length - 1;
const DASHDOT = { strokeDasharray: "9 4 2 4" };

export function TangentFigure() {
  const [mode, setMode] = useState<Mode>("secant");
  const [id, setId] = useState<Id>("sq");
  const [p, setP] = useState<{ a: number; b: number; probe: number; x: number; y: number; t: number }>({ ...START.sq });
  const s = useTween(1, 2600);
  const [step, setStep] = useState(LAST);
  const fn = FN1[id];
  const f = fn.f;
  const df = (x: number) => fn.df!(x) as number;
  const { x: vx, y: vy0 } = VIEW[id];
  const vy: V2 = mode === "reverse" ? [vy0[0] - 1.6, vy0[1]] : vy0;
  const dx = (vx[1] - vx[0]) * 0.035;
  const dy = (vy[1] - vy[0]) * 0.05;
  const set = (patch: Partial<typeof p>) => setP((q) => ({ ...q, ...patch }));

  const choose = (next: Id) => {
    setId(next);
    setP({ ...START[next] });
    s.set(START[next].s);
  };
  const reset = () => {
    setMode("secant");
    choose("sq");
    setStep(LAST);
  };
  const tangentAt = (c: number) => (x: number) => f(c) + df(c) * (x - c);

  /* ---------------- secant → tangent ---------------- */
  const { a, b } = p;
  const sv = Math.max(0, s.value);
  const atZero = sv < 1e-9;
  const deriv = df(a) * (b - a);
  const Q = atZero || a === b ? deriv : quotient(f, a, b, sv);
  const rise = f(b) - f(a);
  const pS = a + sv * (b - a);
  const secSlope = a === b ? df(a) : Q / (b - a);

  /* ---------------- global support ---------------- */
  const h = tangentAt(a);
  const gap = f(p.probe) - h(p.probe);
  const gapSign = signOf(gap);
  // x³: f - h_a = (x - a)²(x + 2a) < 0 exactly when x < -2a
  const cubeBad = id === "cube" ? -2 * a : null;

  /* ---------------- reverse proof ---------------- */
  const { x, y, t } = p;
  const z = (1 - t) * x + t * y;
  const hz = tangentAt(z);
  const wx = (1 - t) * (x - z);
  const wy = t * (y - z);
  const ell = (1 - t) * f(x) + t * f(y);
  const row1 = vy[0] + 1.1;
  const row2 = vy[0] + 0.45;

  const fnOptions = [
    { value: "sq" as Id, tex: "x^2" },
    { value: "quart" as Id, tex: "x^4" },
    ...(mode === "reverse" ? [] : [{ value: "cube" as Id, tex: "x^3" }]),
  ];

  let readout;
  if (mode === "secant") {
    readout = (
      <Readout
        tex={`\\underbrace{${atZero ? "f'(a)(b-a)" : `\\tfrac{f(a+s(b-a))-f(a)}{s}`}}_{${texNum(Q)}} \\;${Q <= rise + 1e-9 ? "\\le" : ">"}\\; \\underbrace{f(b)-f(a)}_{${texNum(rise)}}`}
        items={[
          { label: "s", tex: atZero ? "0\\ (\\text{limit})" : texNum(sv, 3) },
          { label: "secant quotient", tex: atZero ? "\\text{not formed at } s=0" : texNum(Q), tone: "copper" },
          { label: "f'(a)(b−a)", tex: texNum(deriv) },
          { label: "f(b) − f(a)", tex: texNum(rise), tone: "blue" },
        ]}
      />
    );
  } else if (mode === "support") {
    readout = (
      <Readout
        tex={
          id === "sq"
            ? `h_a(x)=2ax-a^2,\\qquad f(x)-h_a(x)=(x-a)^2 = ${texNum(gap)}`
            : id === "cube"
              ? `h_a(x)=3a^2x-2a^3,\\qquad f(x)-h_a(x)=(x-a)^2(x+2a) = ${texNum(gap)}`
              : `h_a(x)=4a^3x-3a^4,\\qquad f(x)-h_a(x)=(x-a)^2(x^2+2ax+3a^2) = ${texNum(gap)}`
        }
        items={[
          { label: "base a", tex: texNum(a, 2) },
          { label: "probe x", tex: texNum(p.probe, 2) },
          { label: "f(x)", tex: texNum(f(p.probe)), tone: "blue" },
          { label: "h_a(x)", tex: texNum(h(p.probe)) },
          { label: "gap", tex: texNum(gap), tone: gapSign === "negative" ? undefined : "teal" },
        ]}
      />
    );
  } else {
    readout = (
      <Readout
        tex={`(1-t)\\underbrace{(x-z)}_{${texNum(x - z)}} + t\\underbrace{(y-z)}_{${texNum(y - z)}} = ${texNum(wx)} + ${texNum(wy)} = 0,\\qquad \\underbrace{(1-t)f(x)+tf(y)}_{${texNum(ell)}} \\ \\ge\\ \\underbrace{f(z)}_{${texNum(f(z))}}`}
        items={[
          { label: "z", tex: texNum(z) },
          { label: "slope f′(z)", tex: texNum(df(z)) },
          { label: "f(x) − h_z(x)", tex: texNum(f(x) - hz(x)), tone: "teal" },
          { label: "f(y) − h_z(y)", tex: texNum(f(y) - hz(y)), tone: "teal" },
        ]}
      />
    );
  }

  return (
    <Stage
      hint={mode === "secant" ? "slide s toward 0, or press Approach" : mode === "support" ? "move the base point a and the probe x" : "step through the proof"}
      controls={
        <>
          <Segmented
            label="Mode"
            value={mode}
            onChange={(m) => {
              setMode(m);
              if (m === "reverse" && id === "cube") choose("sq");
              setStep(m === "reverse" ? 0 : LAST);
            }}
            options={[
              { value: "secant", text: "Secant → tangent" },
              { value: "support", text: "Global support" },
              { value: "reverse", text: "Reverse proof" },
            ]}
          />
          <Segmented label="Function" value={id} onChange={choose} options={fnOptions} />
          {mode === "secant" ? (
            <>
              <Slider tex="a" value={a} min={vx[0] + 0.3} max={vx[1] - 0.3} step={0.05} onChange={(v) => set({ a: v })} show={texNum(a, 2)} />
              <Slider tex="b" value={b} min={vx[0] + 0.3} max={vx[1] - 0.3} step={0.05} onChange={(v) => set({ b: v })} show={texNum(b, 2)} />
              <Slider tex="s" value={sv} min={0} max={1} step={0.01} onChange={s.set} show={atZero ? "0" : texNum(sv, 2)} />
              <Action primary onClick={() => (s.set(1), s.to(0))}>
                Approach <Tex tex="s\downarrow0" />
              </Action>
            </>
          ) : null}
          {mode === "support" ? (
            <>
              <Slider tex="a" value={a} min={vx[0] + 0.3} max={vx[1] - 0.3} step={0.05} onChange={(v) => set({ a: v })} show={texNum(a, 2)} />
              <Slider tex="x" value={p.probe} min={vx[0] + 0.1} max={vx[1] - 0.1} step={0.05} onChange={(v) => set({ probe: v })} show={texNum(p.probe, 2)} />
              {id === "cube" ? <Action onClick={() => set({ a: 0.5, probe: -1.6 })}>A point where the tangent is above</Action> : null}
            </>
          ) : null}
          {mode === "reverse" ? (
            <>
              <Slider tex="x" value={x} min={vx[0] + 0.3} max={vx[1] - 0.3} step={0.05} onChange={(v) => set({ x: v })} show={texNum(x, 2)} />
              <Slider tex="y" value={y} min={vx[0] + 0.3} max={vx[1] - 0.3} step={0.05} onChange={(v) => set({ y: v })} show={texNum(y, 2)} />
              <Slider tex="t" value={t} min={0.05} max={0.95} step={0.05} onChange={(v) => set({ t: v })} show={texNum(t, 2)} />
              <Stepper steps={STEPS} step={step} onStep={setStep} />
            </>
          ) : null}
          <Action onClick={reset}>Reset</Action>
        </>
      }
      readout={
        <>
          {readout}
        </>
      }
      caption={
        <>
          <strong>When does the local Taylor approximation become a global lower bound?</strong>{" "}
          {mode === "secant" ? (
            <>
              The copper secant through <Tex tex="a" /> and <Tex tex="a+s(b-a)" /> turns into the violet tangent as <Tex tex="s\downarrow0" />. Convexity puts every
              secant quotient below <Tex tex="f(b)-f(a)" />, so the limit <Tex tex="f'(a)(b-a)" /> inherits the bound: the tangent stays under the distant point{" "}
              <Tex tex="(b,f(b))" />. At <Tex tex="s=0" /> no quotient is formed; the derivative is used.
            </>
          ) : mode === "support" ? (
            <>
              For <Tex tex="x^2" /> the tangent at <Tex tex="a" /> misses the graph by exactly <Tex tex="(x-a)^2\ge0" />, everywhere, not only near <Tex tex="a" />. For{" "}
              <Tex tex="x^3" /> the gap <Tex tex="(x-a)^2(x+2a)" /> turns negative for <Tex tex="x<-2a" /> (red): a tangent that is only a local approximation.
            </>
          ) : (
            <>
              The tangent is taken at the mixed point <Tex tex="z" />, so its slope term appears as <Tex tex="f'(z)(x-z)" /> and <Tex tex="f'(z)(y-z)" />; with weights{" "}
              <Tex tex="1-t" /> and <Tex tex="t" /> the displacements cancel, leaving the chord inequality.
            </>
          )}{" "}
          Strictness does not pass through the limit in the first proof; the strict version needs the separate argument in{" "}
          <a href="#first-order-information-becomes-a-global-bound">§5.3</a>.
        </>
      }
    >
      <Plane x={vx} y={vy} height={400} stretch>
        <Plot.OfX y={f} color={C.blue} weight={3} />
        {mode === "support" && cubeBad !== null && cubeBad > vx[0] ? (
          <>
            <Plot.OfX y={f} domain={[vx[0], Math.min(cubeBad, vx[1])]} color={C.red} weight={4} />
            <Line.Segment point1={[vx[0], 0]} point2={[Math.min(cubeBad, vx[1]), 0]} color={C.red} weight={5} opacity={0.5} />
            <LaTeX at={[Math.max(vx[0] + 3 * dx, Math.min(cubeBad, vx[1]) - 3 * dx), dy * 1.6]} tex="x<-2a" color={C.red} />
          </>
        ) : null}

        {mode === "secant" ? (
          <>
            <Plot.OfX y={(u) => f(a) + df(a) * (u - a)} color={C.violet} weight={2} opacity={atZero ? 1 : 0.55} svgPathProps={DASHDOT} />
            {!atZero ? <Plot.OfX y={(u) => f(a) + secSlope * (u - a)} color={C.copper} weight={2.5} style="dashed" /> : null}
            <Line.Segment point1={[b, Math.min(f(b), f(a) + deriv, f(a) + Q)]} point2={[b, Math.max(f(b), f(a) + deriv, f(a) + Q)]} color={C.faint} weight={1} style="dashed" />
            <Point x={b} y={f(a) + deriv} color={C.violet} svgCircleProps={{ r: 5 }} />
            {!atZero ? <Point x={b} y={f(a) + Q} color={C.copper} svgCircleProps={{ r: 5 }} /> : null}
            <Point x={a} y={f(a)} color={C.ink} />
            {!atZero ? <Point x={pS} y={f(pS)} color={C.copper} /> : null}
            <Point x={b} y={f(b)} color={C.blue} />
            <LaTeX at={[a - dx, f(a) + dy]} tex="a" color={C.ink} />
            <LaTeX at={[b + 1.4 * dx, f(b)]} tex="f(b)" color={C.blue} />
            <LaTeX at={[b + 1.4 * dx, f(a) + deriv - dy * 0.4]} tex="h_a(b)" color={C.violet} />
          </>
        ) : null}

        {mode === "support" ? (
          <>
            <Plot.OfX y={h} color={C.violet} weight={2.2} svgPathProps={DASHDOT} />
            {Math.abs(gap) > 1e-9 ? <Line.Segment point1={[p.probe, h(p.probe)]} point2={[p.probe, f(p.probe)]} color={gapSign === "negative" ? C.red : C.teal} weight={4} /> : null}
            <Point x={p.probe} y={f(p.probe)} color={C.blue} svgCircleProps={{ r: 5 }} />
            <Point x={p.probe} y={h(p.probe)} color={C.violet} svgCircleProps={{ r: 5 }} />
            <Point x={a} y={f(a)} color={C.ink} />
            <LaTeX at={[a - dx, f(a) + dy]} tex="a" color={C.ink} />
            <LaTeX at={[vx[1] - 2.5 * dx, h(vx[1] - 2.5 * dx) - dy]} tex="h_a" color={C.violet} />
          </>
        ) : null}

        {mode === "reverse" ? (
          <>
            <Point x={x} y={f(x)} color={C.ink} />
            <Point x={y} y={f(y)} color={C.ink} />
            <Point x={z} y={f(z)} color={C.blue} />
            <LaTeX at={[x - dx, f(x) + dy]} tex="x" color={C.ink} />
            <LaTeX at={[y + dx, f(y) + dy]} tex="y" color={C.ink} />
            <LaTeX at={[z + 1.3 * dx, f(z) - dy]} tex="z" color={C.blue} />
            {step >= 1 ? (
              <>
                <Plot.OfX y={hz} color={C.violet} weight={2.2} svgPathProps={DASHDOT} />
                <LaTeX at={[vx[1] - 2.5 * dx, hz(vx[1] - 2.5 * dx) - dy]} tex="h_z" color={C.violet} />
              </>
            ) : null}
            {step >= 2 ? (
              <>
                <Line.Segment point1={[x, hz(x)]} point2={[x, f(x)]} color={C.teal} weight={3.5} />
                <Line.Segment point1={[y, hz(y)]} point2={[y, f(y)]} color={C.teal} weight={3.5} />
                <Point x={x} y={hz(x)} color={C.violet} svgCircleProps={{ r: 4.5 }} />
                <Point x={y} y={hz(y)} color={C.violet} svgCircleProps={{ r: 4.5 }} />
              </>
            ) : null}
            {step >= 3 ? (
              <>
                <Line.Segment point1={[z, row1]} point2={[z, f(z)]} color={C.faint} weight={1} style="dashed" />
                <Vector tail={[z, row1]} tip={[x, row1]} color={C.muted} weight={2} />
                <Vector tail={[z, row1]} tip={[y, row1]} color={C.muted} weight={2} />
                <LaTeX at={[(x + z) / 2, row1 + dy * 0.75]} tex="x-z" color={C.muted} />
                <LaTeX at={[(y + z) / 2, row1 + dy * 0.75]} tex="y-z" color={C.muted} />
              </>
            ) : null}
            {step >= 4 ? (
              <>
                <Vector tail={[z, row2]} tip={[z + wx, row2]} color={C.copper} weight={3} />
                <Vector tail={[z, row2]} tip={[z + wy, row2]} color={C.copper} weight={3} />
                <LaTeX at={[z + wx - 2.2 * dx, row2 + dy * 0.1]} tex="(1-t)(x-z)" color={C.copper} />
                <LaTeX at={[z + wy + 1.6 * dx, row2 + dy * 0.1]} tex="t(y-z)" color={C.copper} />
              </>
            ) : null}
            {step >= 5 ? (
              <>
                <Line.Segment point1={[x, f(x)]} point2={[y, f(y)]} color={C.copper} weight={2.5} style="dashed" />
                <Point x={z} y={ell} color={C.copper} />
                <Line.Segment point1={[z + dx * 0.4, f(z)]} point2={[z + dx * 0.4, ell]} color={C.teal} weight={4} />
                <LaTeX at={[z - 1.3 * dx, ell + dy * 0.8]} tex="\ell" color={C.copper} />
              </>
            ) : null}
          </>
        ) : null}
      </Plane>
    </Stage>
  );
}
