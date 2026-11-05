"use client";

import { LaTeX, Line, Plot, Point, Polygon, Vector, useMovablePoint } from "mafs";
import { Action, C, Plane, Readout, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";
import styles from "./CauchyFigure.module.css";

type V = [number, number];

const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];

/**
 * Everything the figure reads off two vectors. The parabola
 * q(t) = ‖x − ty‖² = ‖x‖² − 2t⟨x,y⟩ + t²‖y‖² has its lowest point at
 * t* = ⟨x,y⟩/‖y‖², with value ‖x‖² − ⟨x,y⟩²/‖y‖². In the plane that value is
 * det[x y]²/‖y‖² (Lagrange's identity), which is computed exactly on the grid.
 */
export function cauchy(x: number[], y: number[]) {
  const ip = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const xx = x.reduce((s, xi) => s + xi * xi, 0);
  const yy = y.reduce((s, yi) => s + yi * yi, 0);
  const nx = Math.sqrt(xx);
  const ny = Math.sqrt(yy);
  const cos = nx > 0 && ny > 0 ? ip / (nx * ny) : NaN;
  const tStar = yy > 0 ? ip / yy : 0;
  const min = yy > 0 ? xx - (ip * ip) / yy : xx;
  const q = (t: number) => xx - 2 * t * ip + t * t * yy;
  return { ip, nx, ny, cos, tStar, min, q };
}

const W = 2; // the parabola is drawn for t within W of its centre

export function CauchyFigure() {
  const x = useMovablePoint([1, 2], { color: C.blue, constrain: snap });
  const y = useMovablePoint([2, 1], { color: C.teal, constrain: snap });
  const tw = useTween(0, 1100);
  const t = tw.value;
  const { ip, nx, ny, cos, tStar, q } = cauchy(x.point, y.point);
  const det = x.x * y.y - x.y * y.x;
  // the exact minimum on the grid: det² / ‖y‖², or ‖x‖² when y = 0
  const min = ny > 0 ? (det * det) / (ny * ny) : nx * nx;
  const parallel = det === 0;
  const degenerate = nx === 0 || ny === 0;
  const kind = degenerate ? "\\text{undefined}" : ip > 0 ? "\\text{acute}" : ip < 0 ? "\\text{obtuse}" : "\\text{right}";

  // the angle arc from x to y the short way round
  const ax = Math.atan2(x.y, x.x);
  const delta = Math.atan2(Math.sin(Math.atan2(y.y, y.x) - ax), Math.cos(Math.atan2(y.y, y.x) - ax));
  const rArc = Math.min(0.7, 0.45 * Math.min(nx, ny));
  const ux: V = [x.x / nx, x.y / nx];
  const uy: V = [y.x / ny, y.y / ny];
  const ty: V = [t * y.x, t * y.y];

  // the parabola plot is centred at t* and scaled so that it fills the box
  const tc = ny > 0 ? tStar : 0;
  const top = Math.max(q(tc - W), q(tc + W), 1e-9);
  const sy = 3 / top;
  const ticks = Array.from({ length: 2 * W + 3 }, (_, i) => Math.ceil(tc - W) + i - 1).filter((n) => Math.abs(n - tc) <= W);

  const presets: [string, V, V][] = [
    ["Acute", [1, 2], [2, 1]],
    ["Right angle", [1, 2], [-2, 1]],
    ["Obtuse", [1, 2], [-2, -0.5]],
    ["Parallel", [1, 2], [-1, -2]],
  ];

  return (
    <Stage
      hint="drag x and y"
      controls={
        <>
          {presets.map(([name, px, py]) => (
            <Action
              key={name}
              onClick={() => {
                x.setPoint(px);
                y.setPoint(py);
              }}
            >
              {name}
            </Action>
          ))}
          <Slider tex="t" value={t} min={-3} max={3} step={0.05} onChange={tw.set} show={fmt(t, 2)} />
          <Action primary onClick={() => tw.to(tStar)}>
            Minimize over <Tex tex="t" />
          </Action>
        </>
      }
      readout={
        <Readout
          tex={
            degenerate
              ? `\\langle x,y\\rangle = ${fmt(ip)},\\qquad \\text{a zero vector has no angle}`
              : `\\langle x,y\\rangle = ${fmt(ip)},\\quad \\|x\\|\\,\\|y\\| = ${fmt(nx, 3)}\\cdot${fmt(ny, 3)} = ${fmt(nx * ny)},\\quad \\cos\\theta = ${fmt(cos)},\\quad \\theta = ${fmt((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI, 1)}^\\circ`
          }
          items={[
            {
              label: "Cauchy–Schwarz",
              tex: `${fmt(ip * ip)} ${parallel ? "=" : "<"} ${fmt(nx * nx * ny * ny)}`,
              tone: parallel ? "copper" : "teal",
            },
            { label: "angle", tex: kind },
            { label: "‖x − ty‖² now", tex: fmt(q(t)), tone: "blue" },
            {
              label: "lowest value",
              tex: ny > 0 ? `\\|x\\|^2 - \\tfrac{\\langle x,y\\rangle^2}{\\|y\\|^2} = ${fmt(min)}\\ \\text{at}\\ t^\\star = ${fmt(tStar)}` : `\\|x\\|^2 = ${fmt(min)}`,
              tone: "copper",
            },
          ]}
        />
      }
      caption={
        <>
          The sign of <Tex tex="\langle x,y\rangle" /> reads the angle: positive is acute, zero is right, negative is obtuse. On the right is{" "}
          <Tex tex="q(t) = \|x - ty\|^2 = \|x\|^2 - 2t\langle x,y\rangle + t^2\|y\|^2" />, the squared length of the copper segment. It never goes
          below zero, and for <Tex tex="y \ne 0" /> its lowest value, at <Tex tex="t^\star = \langle x,y\rangle/\|y\|^2" />, is{" "}
          <Tex tex="\|x\|^2 - \langle x,y\rangle^2/\|y\|^2 \ge 0" />. Multiplied by <Tex tex="\|y\|^2" /> that is Cauchy–Schwarz, and the lowest
          value is zero exactly when <Tex tex="x" /> is a multiple of <Tex tex="y" />. At <Tex tex="t^\star" /> the segment meets the line of{" "}
          <Tex tex="y" /> at a right angle. For the notes&apos; <Tex tex="x = (1,2,2)^\mathsf{T}" /> and <Tex tex="y = (3,0,4)^\mathsf{T}" /> the lowest
          value is <Tex tex="9 - 121/25 = 104/25" />, the same fact as <Tex tex="11 \le 15" />.
        </>
      }
    >
      <div className={styles.views}>
        <Plane x={[-3.5, 3.5]} y={[-3, 4.2]} height={380}>
          {ny > 0 ? <Line.ThroughPoints point1={[0, 0]} point2={y.point} color={C.teal} weight={1} opacity={0.4} style="dashed" /> : null}
          {!degenerate && ip === 0 ? (
            <Polygon
              points={[[0, 0], [0.3 * ux[0], 0.3 * ux[1]], [0.3 * (ux[0] + uy[0]), 0.3 * (ux[1] + uy[1])], [0.3 * uy[0], 0.3 * uy[1]]]}
              color={C.ink}
              fillOpacity={0}
              weight={1.5}
            />
          ) : !degenerate ? (
            <>
              <Plot.Parametric xy={(s) => [rArc * Math.cos(ax + s * delta), rArc * Math.sin(ax + s * delta)]} domain={[0, 1]} color={C.ink} weight={1.5} />
              <LaTeX at={[(rArc + 0.3) * Math.cos(ax + delta / 2), (rArc + 0.3) * Math.sin(ax + delta / 2)]} tex="\theta" color={C.ink} />
            </>
          ) : null}
          {/* t·y and the segment x − t·y, whose squared length is the parabola */}
          <Vector tip={ty} color={C.teal} weight={4} opacity={0.35} />
          <Line.Segment point1={ty} point2={x.point} color={C.copper} weight={3} />
          {ny > 0 ? <Point x={tStar * y.x} y={tStar * y.y} color={C.copper} opacity={0.7} svgCircleProps={{ r: 4 }} /> : null}
          <Vector tip={y.point} color={C.teal} weight={3} />
          <Vector tip={x.point} color={C.blue} weight={3} />
          <LaTeX at={[x.x + 0.3, x.y + 0.35]} tex="x" color={C.blue} />
          <LaTeX at={[y.x + 0.35, y.y - 0.3]} tex="y" color={C.teal} />
          {y.element}
          {x.element}
        </Plane>
        <div className={styles.side}>
          <Plane x={[-W - 0.5, W + 0.5]} y={[-0.8, 3.7]} height={380} grid={false}>
            <Line.Segment point1={[-W - 0.3, 0]} point2={[W + 0.3, 0]} color={C.muted} weight={1.5} />
            {ticks.map((n) => (
              <g key={n}>
                <Line.Segment point1={[n - tc, -0.06]} point2={[n - tc, 0.06]} color={C.muted} weight={1.5} />
                <LaTeX at={[n - tc, -0.3]} tex={String(n)} color={C.muted} />
              </g>
            ))}
            <LaTeX at={[W + 0.3, 0.3]} tex="t" color={C.muted} />
            <LaTeX at={[0, 3.45]} tex="\|x - t y\|^2" color={C.ink} />
            <Plot.OfX y={(u) => sy * q(u + tc)} domain={[-W, W]} color={C.ink} weight={2.5} />
            {/* the lowest point, never below the axis */}
            <Line.Segment point1={[0, 0]} point2={[0, sy * min]} color={C.copper} weight={1} style="dashed" />
            <Point x={0} y={sy * min} color={C.copper} />
            <LaTeX at={[0.05, -0.6]} tex={ny > 0 ? "t^\\star" : ""} color={C.copper} />
            {Math.abs(t - tc) <= W ? (
              <>
                <Line.Segment point1={[t - tc, 0]} point2={[t - tc, sy * q(t)]} color={C.blue} weight={1} opacity={0.5} />
                <Point x={t - tc} y={sy * q(t)} color={C.blue} />
              </>
            ) : null}
          </Plane>
        </div>
      </div>
    </Stage>
  );
}

