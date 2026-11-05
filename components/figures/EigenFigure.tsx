"use client";

import { LaTeX, Line, Text, Vector, useMovablePoint } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";

type V = [number, number];

// the notes' A = [[4,-5],[2,-3]]: lambda = 2 along (5,2), lambda = -1 along (1,1)
const E1: V = [5, 2];
const E2: V = [1, 1];
const L1 = 2;
const L2 = -1;
const KMAX = 6;
const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];

/** Coordinates of x in the eigenbasis: x = c1 (5,2) + c2 (1,1). */
export const coords = ([x, y]: V): V => [(x - y) / 3, (5 * y - 2 * x) / 3];

/**
 * The factor a component on the eigenline of lambda carries after "k" steps, for real k:
 * whole steps multiply by lambda, and a partial step moves along (1-s) + s lambda,
 * the path (1-s)I + sA takes on that line. At whole k it is lambda^k.
 */
export const factor = (lambda: number, k: number) => {
  const whole = Math.floor(k);
  const s = k - whole;
  return lambda ** whole * (1 - s + s * lambda);
};

/** A^k x, by the split along the eigenlines. */
export function power(x: V, k: number) {
  const [c1, c2] = coords(x);
  const s1 = c1 * factor(L1, k);
  const s2 = c2 * factor(L2, k);
  const p1: V = [s1 * E1[0], s1 * E1[1]];
  const tip: V = [p1[0] + s2 * E2[0], p1[1] + s2 * E2[1]];
  return { c1, c2, s1, s2, p1, tip };
}

/** A rational with a small denominator in LaTeX, as the notes write 1/3 and 2/3; decimals otherwise. */
export function frac(n: number) {
  for (const d of [1, 2, 3, 4, 6, 12]) {
    const p = Math.round(n * d);
    if (Math.abs(n * d - p) < 1e-9) {
      if (d === 1) return String(p);
      const g = gcd(Math.abs(p), d);
      const [pp, dd] = [p / g, d / g];
      return dd === 1 ? String(pp) : `${pp < 0 ? "-" : ""}\\tfrac{${Math.abs(pp)}}{${dd}}`;
    }
  }
  return fmt(n, 3);
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export function EigenFigure() {
  const x = useMovablePoint([1, 0], { color: C.blue, constrain: (p) => snap(p as V) });
  const [k, setK] = useState(0);
  // the drawn power moves continuously between whole steps
  const kt = useTween(0, 900);
  const go = (target: number) => {
    setK(target);
    kt.to(target, 800 * Math.max(1, Math.abs(target - kt.value)));
  };

  const shown = power(x.point, kt.value);
  // zoom out so that every arrow stays in view: the window is [-6.5z, 6.5z] x [-4z, 4z]
  const need = [x.point, shown.p1, shown.tip].map(([a, b]) => Math.max(Math.abs(a) / 6, Math.abs(b) / 3.6));
  const z = Math.max(1, ...need);
  // grid spacing doubles as the window grows
  const g = 2 ** Math.max(0, Math.ceil(Math.log2(z)));
  const nx = Math.ceil((6.5 * z) / g);
  const ny = Math.ceil((4 * z) / g);

  // the readout is at the whole step the figure is going to
  const at = power(x.point, k);
  const [c1, c2] = [at.c1, at.c2];
  const piece = (coeff: number, body: string, first: boolean) => {
    if (Math.abs(coeff) < 1e-12) return "";
    const f = frac(Math.abs(coeff));
    const num = f === "1" ? "" : f;
    return `${coeff < 0 ? "-" : first ? "" : "+"}${num}\\,${body}`;
  };
  const split = `${piece(at.s1, "(5,2)", true)}${piece(at.s2, "(1,1)", Math.abs(at.s1) < 1e-12)}` || "0";
  const len = Math.hypot(...at.tip);
  const angle = len < 1e-12 ? NaN : (Math.acos(Math.max(-1, Math.min(1, (at.tip[0] * 5 + at.tip[1] * 2) / (len * Math.hypot(5, 2))))) * 180) / Math.PI;
  const whole = Math.abs(kt.value - Math.round(kt.value)) < 1e-6;

  return (
    <Stage
      hint="drag x"
      controls={
        <>
          <Slider tex="k" value={k} min={0} max={KMAX} step={1} onChange={go} />
          <Action primary onClick={() => go(k >= KMAX ? 0 : k + 1)}>
            {k >= KMAX ? (
              <>
                Back to <Tex tex="k=0" />
              </>
            ) : (
              <>
                Apply <Tex tex="A" />
              </>
            )}
          </Action>
          <Action
            onClick={() => {
              x.setPoint([1, 0]);
              go(0);
            }}
          >
            The notes&apos; <Tex tex="x=(1,0)" />
          </Action>
        </>
      }
      readout={
        <Readout
          tex={`x = ${piece(c1, "(5,2)", true)}${piece(c2, "(1,1)", Math.abs(c1) < 1e-12)}${Math.abs(c1) < 1e-12 && Math.abs(c2) < 1e-12 ? "0" : ""},\\qquad A^{${k}}x = ${split} = (${frac(at.tip[0])},\\ ${frac(at.tip[1])})`}
          items={[
            { label: "teal coefficient", tex: `c_1\\,2^{${k}} = ${frac(at.s1)}`, tone: "teal" },
            { label: "copper coefficient", tex: `c_2\\,(-1)^{${k}} = ${frac(at.s2)}`, tone: "copper" },
            { label: "angle to (5,2)", tex: Number.isFinite(angle) ? `${fmt(angle, 2)}^\\circ` : "\\text{undefined}" },
            { label: "window", tex: z > 1.001 ? `\\text{zoomed out } ${fmt(z, 1)}\\times` : "\\text{actual size}" },
          ]}
        />
      }
      caption={
        <>
          Teal is the component on the eigenline of <Tex tex="\lambda=2" />, copper the one on <Tex tex="\lambda=-1" />, laid head to tail to reach <Tex tex="A^k x" />. Each application of{" "}
          <Tex tex="A" /> doubles the teal piece and reverses the copper one, which passes through zero on the way. The notes&apos; <Tex tex="(1,0)=\tfrac13(5,2)-\tfrac23(1,1)" /> has
          coefficients <Tex tex="2^k/3" /> and <Tex tex="-\tfrac23(-1)^k" /> after <Tex tex="k" /> steps; the first dominates, so the direction turns toward <Tex tex="(5,2)" />. The window
          zooms out as the vector grows, and the grid spacing doubles with it.
        </>
      }
    >
      <Plane x={[-6.5 * z, 6.5 * z]} y={[-4 * z, 4 * z]} height={440} grid={false}>
        {Array.from({ length: 2 * nx + 1 }, (_, i) => i - nx).map((i) => (
          <Line.Segment key={`v${i}`} point1={[i * g, -ny * g]} point2={[i * g, ny * g]} color={C.muted} opacity={i === 0 ? 0.45 : 0.12} weight={1} />
        ))}
        {Array.from({ length: 2 * ny + 1 }, (_, i) => i - ny).map((i) => (
          <Line.Segment key={`h${i}`} point1={[-nx * g, i * g]} point2={[nx * g, i * g]} color={C.muted} opacity={i === 0 ? 0.45 : 0.12} weight={1} />
        ))}
        {Array.from({ length: 2 * nx + 1 }, (_, i) => i - nx)
          .filter((i) => i !== 0 && i % 2 === 0)
          .map((i) => (
            <Text key={`t${i}`} x={i * g} y={0} attach="s" size={11} color={C.faint}>
              {String(i * g)}
            </Text>
          ))}
        <Line.ThroughPoints point1={[0, 0]} point2={E1} color={C.teal} style="dashed" opacity={0.6} />
        <Line.ThroughPoints point1={[0, 0]} point2={E2} color={C.copper} style="dashed" opacity={0.6} />
        <LaTeX at={[5.3 * z, 1.45 * z]} tex="\lambda=2" color={C.teal} />
        <LaTeX at={[-2.2 * z, -3.3 * z]} tex="\lambda=-1" color={C.copper} />
        {kt.value > 0 ? <Vector tip={x.point} color={C.blue} weight={2} opacity={0.7} /> : null}
        <Vector tip={shown.p1} color={C.teal} weight={5} opacity={0.7} />
        <Vector tail={shown.p1} tip={shown.tip} color={C.copper} weight={5} opacity={0.7} />
        <Vector tip={shown.tip} color={C.ink} weight={2.5} />
        {kt.value > 0.05 ? <LaTeX at={[shown.tip[0] + 0.5 * z, shown.tip[1] + 0.45 * z]} tex={whole ? `A^{${Math.round(kt.value)}}x` : "A^k x"} color={C.ink} /> : null}
        <LaTeX at={[x.x + 0.35 * z, x.y - 0.4 * z]} tex="x" color={C.blue} />
        {x.element}
      </Plane>
    </Stage>
  );
}
