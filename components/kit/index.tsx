"use client";

// The figure kit: one look for every interactive in the notes.
//   <Stage>        the figure: view, controls, readout, caption
//   <Plane>        a Mafs coordinate plane in the site's colours
//   <Segmented>    a choice between options whose labels are LaTeX
//   <Slider>       a range input labelled in LaTeX, with its value in LaTeX
//   <Action>       a button whose label may be LaTeX
//   <Readout>      the live formula under a figure
//   useTween       animate a number from a to b (instant under reduced motion)
import katex from "katex";
import { Coordinates, Mafs } from "mafs";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./kit.module.css";

/** Colours as CSS variables, so every figure follows the theme without redrawing. */
export const C = {
  ink: "var(--ink)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  teal: "var(--accent)",
  copper: "var(--copper)",
  blue: "var(--blue)",
  violet: "var(--violet)",
  red: "var(--red)",
} as const;

export function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Stage({
  children,
  controls,
  readout,
  caption,
  hint,
}: {
  children: ReactNode;
  controls?: ReactNode;
  readout?: ReactNode;
  caption?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <figure className={styles.stage}>
      <div className={styles.view}>
        {children}
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
      {controls ? <div className={styles.controls}>{controls}</div> : null}
      {readout}
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}

export function Plane({
  x,
  y,
  height = 420,
  children,
  grid = true,
  stretch = false,
}: {
  x: [number, number];
  y: [number, number];
  height?: number;
  children: ReactNode;
  grid?: boolean;
  /** fill the box exactly, with unequal x and y scales (for graphs of functions) */
  stretch?: boolean;
}) {
  return (
    <div className={styles.plane}>
      <Mafs height={height} viewBox={{ x, y, padding: 0 }} preserveAspectRatio={stretch ? false : "contain"} pan={false} zoom={false}>
        {grid ? <Coordinates.Cartesian subdivisions={2} xAxis={{ lines: 1, labels: (n) => (n % 2 === 0 && n !== 0 ? n : "") }} yAxis={{ lines: 1, labels: (n) => (n % 2 === 0 && n !== 0 ? n : "") }} /> : null}
        {children}
      </Mafs>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; tex?: string; text?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.tex ? <Tex tex={o.tex} /> : o.text}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  tex,
  value,
  min,
  max,
  step,
  onChange,
  show,
}: {
  tex: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** LaTeX for the value; defaults to the number */
  show?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.slider}>
      <label htmlFor={id} className={styles.sliderLabel}>
        <Tex tex={`${tex} = ${show ?? fmt(value)}`} />
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%` }}
      />
    </div>
  );
}

export function Action({ tex, children, onClick, pressed, primary }: { tex?: string; children?: ReactNode; onClick: () => void; pressed?: boolean; primary?: boolean }) {
  return (
    <button type="button" className={`${styles.action} ${primary ? styles.primary : ""}`} aria-pressed={pressed} onClick={onClick}>
      {tex ? <Tex tex={tex} /> : null}
      {children}
    </button>
  );
}

export function Readout({ tex, items }: { tex?: string; items?: { label: string; tex: string; tone?: "teal" | "copper" | "blue" }[] }) {
  return (
    <div className={styles.readout} aria-live="polite">
      {tex ? <Tex tex={tex} display /> : null}
      {items ? (
        <dl className={styles.items}>
          {items.map((it) => (
            <div key={it.label} data-tone={it.tone}>
              <dt>{it.label}</dt>
              <dd>
                <Tex tex={it.tex} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export const Controls = ({ children }: { children: ReactNode }) => <div className={styles.group}>{children}</div>;

/** A number for LaTeX: three decimals at most, no "-0". */
export function fmt(n: number, digits = 3) {
  if (!Number.isFinite(n)) return n > 0 ? "\\infty" : "-\\infty";
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? "0" : String(r);
}

/** A vector for LaTeX, as a column. */
export const vecTex = (v: readonly number[], digits = 2) => `\\begin{bmatrix}${v.map((x) => fmt(x, digits)).join("\\\\")}\\end{bmatrix}`;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * A number that animates to a target with an ease-in-out curve. Call
 * `to(target)` to move; `set(v)` jumps. Under reduced motion it always jumps.
 */
export function useTween(initial: number, duration = 900) {
  const [value, setValue] = useState(initial);
  const raf = useRef(0);
  const current = useRef(initial);
  const reduced = useReducedMotion();
  const set = useCallback((v: number) => {
    cancelAnimationFrame(raf.current);
    current.current = v;
    setValue(v);
  }, []);
  const to = useCallback(
    (target: number, ms = duration) => {
      cancelAnimationFrame(raf.current);
      if (reduced || ms <= 0) return set(target);
      const from = current.current;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        current.current = from + (target - from) * e;
        setValue(current.current);
        if (t < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [duration, reduced, set],
  );
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { value, to, set };
}

/**
 * Previous / Next through a figure's numbered steps, with the current step named.
 * Steps accumulate: step k shows everything introduced in steps 0..k.
 */
export function Stepper({ steps, step, onStep }: { steps: string[]; step: number; onStep: (k: number) => void }) {
  const last = steps.length - 1;
  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.action} onClick={() => onStep(Math.max(0, step - 1))} disabled={step <= 0} aria-label="Previous step">
        ← Previous
      </button>
      <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => onStep(Math.min(last, step + 1))} disabled={step >= last} aria-label="Next step">
        Next →
      </button>
      <span className={styles.stepLabel} aria-live="polite">
        <span className={styles.stepNum}>
          {step + 1}/{steps.length}
        </span>{" "}
        {steps[step]}
      </span>
    </div>
  );
}
