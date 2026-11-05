"use client";

import { LaTeX, Line, Polygon, Polyline, Vector, useMovablePoint } from "mafs";
import { useEffect, useRef } from "react";
import { Action, C, Plane, Readout, Segmented, Stage, Tex, fmt, useTween, vecTex } from "@/components/kit";

type V = [number, number];

const NOTES = { u: [2, 1] as V, x: [3, 4] as V, y: [-3, 1] as V };
const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];

/** Projection of x onto the line through u (u nonzero), with every quantity the section names. */
export function project(u: V, x: V) {
  const uu = dot(u, u);
  const ip = dot(x, u);
  const coeff = ip / uu;
  const proj: V = [coeff * u[0], coeff * u[1]];
  const rest: V = [x[0] - proj[0], x[1] - proj[1]];
  const scalar = ip / Math.sqrt(uu);
  const nx = Math.hypot(...x);
  const theta = nx < 1e-9 ? NaN : Math.acos(Math.max(-1, Math.min(1, ip / (nx * Math.sqrt(uu)))));
  // P = q q^T with q = u/|u|, row-major; P^2 computed, not assumed
  const P = [(u[0] * u[0]) / uu, (u[0] * u[1]) / uu, (u[1] * u[0]) / uu, (u[1] * u[1]) / uu];
  const P2 = [P[0] * P[0] + P[1] * P[2], P[0] * P[1] + P[1] * P[3], P[2] * P[0] + P[3] * P[2], P[2] * P[1] + P[3] * P[3]];
  return { uu, ip, coeff, proj, rest, scalar, theta, P, P2, check: dot(rest, u) };
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** An angle in LaTeX: a fraction of pi when it is a multiple of pi/12, else radians. */
export function angleTex(theta: number) {
  if (!Number.isFinite(theta)) return "\\text{undefined}";
  const k = Math.round((theta / Math.PI) * 12);
  if (Math.abs(theta - (k * Math.PI) / 12) > 1e-6) return `${fmt(theta, 3)}\\ \\text{rad}`;
  if (k === 0) return "0";
  const g = gcd(k, 12);
  const [n, d] = [k / g, 12 / g];
  const top = n === 1 ? "\\pi" : `${n}\\pi`;
  return d === 1 ? top : `\\tfrac{${top}}{${d}}`;
}

const matTex = (m: number[]) => `\\begin{bmatrix}${fmt(m[0], 2)} & ${fmt(m[1], 2)}\\\\ ${fmt(m[2], 2)} & ${fmt(m[3], 2)}\\end{bmatrix}`;

export function ProjectionFigure() {
  const u = useMovablePoint(NOTES.u, {
    color: C.teal,
    // u spans the line, so it may not be the zero vector
    constrain: (p) => {
      const s = snap(p as V);
      return s[0] === 0 && s[1] === 0 ? [0.25, 0] : s;
    },
  });
  const x = useMovablePoint(NOTES.x, { color: C.blue, constrain: (p) => snap(p as V) });

  // one full turn of x about the origin; the shadow passes through both sides of 0
  const sweep = useTween(0, 7000);
  const sweepFrom = useRef<{ r: number; a: number } | null>(null);
  const lastSet = useRef<V | null>(null);
  const here = useRef<V>(x.point);
  here.current = x.point;
  const { setPoint } = x;
  useEffect(() => {
    const s = sweepFrom.current;
    if (!s) return;
    const last = lastSet.current;
    // a drag during the turn wins over the turn
    if (last && Math.hypot(here.current[0] - last[0], here.current[1] - last[1]) > 0.3) {
      sweepFrom.current = null;
      return;
    }
    const a = s.a + sweep.value * 2 * Math.PI;
    lastSet.current = [s.r * Math.cos(a), s.r * Math.sin(a)];
    setPoint(lastSet.current);
    if (sweep.value >= 1) sweepFrom.current = null;
  }, [sweep.value, setPoint]);

  const { uu, ip, coeff, proj, rest, scalar, theta, P, P2, check } = project(u.point, x.point);
  const isU = u.x === 2 && u.y === 1;
  const preset = isU && x.x === 3 && x.y === 4 ? "x" : isU && x.x === -3 && x.y === 1 ? "y" : "";

  const un = Math.sqrt(uu);
  const dir: V = [u.x / un, u.y / un];
  const normal: V = [-dir[1], dir[0]];
  // the right-angle mark at the foot of the perpendicular, on the side of x
  const side = Math.sign(dot(rest, normal)) || 1;
  const m = 0.28;
  const back = coeff >= 0 ? -1 : 1;
  const along: V = [dir[0] * m * back, dir[1] * m * back];
  const up: V = [normal[0] * m * side, normal[1] * m * side];
  const corner: V[] = [
    [proj[0] + along[0], proj[1] + along[1]],
    [proj[0] + along[0] + up[0], proj[1] + along[1] + up[1]],
    [proj[0] + up[0], proj[1] + up[1]],
  ];
  // the angle from u to x, an arc of radius 0.7
  const a0 = Math.atan2(u.y, u.x);
  let a1 = Math.atan2(x.y, x.x);
  while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
  const arc: V[] = Array.from({ length: 41 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 40;
    return [0.7 * Math.cos(a), 0.7 * Math.sin(a)];
  });
  const mid = (a0 + a1) / 2;
  const xVisible = Math.hypot(...x.point) > 0.2;

  return (
    <Stage
      hint="drag u and x"
      controls={
        <>
          <Segmented
            label="The notes' examples"
            value={preset}
            onChange={(v) => {
              sweepFrom.current = null;
              sweep.set(0);
              u.setPoint(NOTES.u);
              x.setPoint(v === "y" ? NOTES.y : NOTES.x);
            }}
            options={[
              { value: "x", tex: "x=(3,4)" },
              { value: "y", tex: "y=(-3,1)" },
            ]}
          />
          <Action
            primary
            onClick={() => {
              sweepFrom.current = { r: Math.max(1, Math.hypot(...x.point)), a: Math.atan2(x.y, x.x) };
              lastSet.current = null;
              sweep.set(0);
              sweep.to(1);
            }}
          >
            Turn <Tex tex="x" /> once around
          </Action>
        </>
      }
      readout={
        <Readout
          tex={`\\begin{gathered}\\operatorname{proj}_u x = \\frac{\\langle x,u\\rangle}{\\|u\\|^2}\\,u = \\frac{${fmt(ip, 2)}}{${fmt(uu, 2)}}${vecTex(u.point)} = ${vecTex(proj)},\\qquad x-\\operatorname{proj}_u x = ${vecTex(rest)}\\\\ \\langle x-\\operatorname{proj}_u x,\\,u\\rangle = ${fmt(check, 6)}\\end{gathered}`}
          items={[
            { label: "inner product ⟨x,u⟩", tex: fmt(ip, 2), tone: ip < 0 ? "copper" : "teal" },
            { label: "scalar projection", tex: `\\tfrac{\\langle x,u\\rangle}{\\|u\\|} = ${fmt(scalar, 3)}`, tone: scalar < 0 ? "copper" : "teal" },
            { label: "angle", tex: `\\theta = ${angleTex(theta)}` },
            { label: "projection matrix", tex: `P = qq^\\mathsf{T} = ${matTex(P)}` },
            { label: "applied twice", tex: `P^2 = ${matTex(P2)}` },
          ]}
        />
      }
      caption={
        <>
          The teal arrow on the dashed line is the shadow <Tex tex="\operatorname{proj}_u x" />, and the copper arrow is the remainder, which meets the line at a right angle. For the
          notes&apos; <Tex tex="u=(2,1)" /> and <Tex tex="x=(3,4)" />, <Tex tex="\langle x,u\rangle=10" />, the shadow is <Tex tex="(4,2)" /> and the remainder is{" "}
          <Tex tex="(-1,2)" />. For <Tex tex="y=(-3,1)" /> the inner product is <Tex tex="-5" />, the angle is <Tex tex="3\pi/4" />, the scalar projection is negative, and the
          shadow <Tex tex="(-2,-1)" /> falls on the other side of the origin. The matrix <Tex tex="P=qq^\mathsf{T}" /> depends only on the line, and applying it twice changes
          nothing.
        </>
      }
    >
      <Plane x={[-5, 6]} y={[-3.5, 5]} height={440}>
        <Line.ThroughPoints point1={[0, 0]} point2={u.point} color={C.teal} opacity={0.45} style="dashed" />
        <Polygon points={[[0, 0], proj, x.point]} color={C.copper} fillOpacity={0.05} weight={0} />
        {Math.hypot(...rest) > 0.3 && Math.hypot(...proj) > 0.3 ? <Polyline points={corner} color={C.ink} weight={1.5} fillOpacity={0} /> : null}
        {xVisible ? <Polyline points={arc} color={C.violet} weight={1.5} fillOpacity={0} /> : null}
        {xVisible ? <LaTeX at={[1.1 * Math.cos(mid), 1.1 * Math.sin(mid)]} tex="\theta" color={C.violet} /> : null}
        <Vector tip={proj} color={C.teal} weight={6} opacity={0.55} />
        <Vector tail={proj} tip={x.point} color={C.copper} weight={3} />
        <Vector tip={x.point} color={C.blue} weight={3} />
        <Vector tip={u.point} color={C.teal} weight={3} />
        <LaTeX at={[proj[0] - normal[0] * 0.55 * side, proj[1] - normal[1] * 0.55 * side]} tex="\operatorname{proj}_u x" color={C.teal} />
        <LaTeX at={[u.x + 0.3, u.y - 0.35]} tex="u" color={C.teal} />
        <LaTeX at={[x.x + 0.35, x.y + 0.35]} tex="x" color={C.blue} />
        {u.element}
        {x.element}
      </Plane>
    </Stage>
  );
}
