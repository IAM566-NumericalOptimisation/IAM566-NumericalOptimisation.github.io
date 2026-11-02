"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import {
  BLUE,
  COPPER,
  GREEN,
  createStage,
  disposeShaft,
  fmt,
  makeLabel,
  makeShaft,
  recolor,
  setLabel,
  setShaft,
} from "./scene";
import styles from "./figures.module.css";

const NOTES = [
  [1, 2, 2],
  [0, 3, 6],
  [6, 3, 3],
];

const STEP_COLORS = [GREEN, COPPER, BLUE];

function gramSchmidt(rows: number[][]) {
  const zs: THREE.Vector3[] = [];
  for (const row of rows) {
    const z = new THREE.Vector3(row[0], row[1], row[2]);
    for (const prev of zs) {
      const denom = prev.dot(prev);
      if (denom < 1e-12) continue;
      z.addScaledVector(prev, -z.dot(prev) / denom);
    }
    zs.push(z);
  }
  const qs = zs.map((z) => {
    const n = z.length();
    return n < 1e-8 ? new THREE.Vector3() : z.clone().multiplyScalar(1 / n);
  });
  return { zs, qs };
}

function vecTex(v: THREE.Vector3) {
  return `(${fmt(v.x)},${fmt(v.y)},${fmt(v.z)})`;
}

function formulaFor(rows: number[][], step: number) {
  const xs = rows.map((row) => new THREE.Vector3(row[0], row[1], row[2]));
  const { zs, qs } = gramSchmidt(rows);
  if (step === 0) return `x_1=${vecTex(xs[0])},\\quad x_2=${vecTex(xs[1])},\\quad x_3=${vecTex(xs[2])}`;
  if (step === 4) {
    return `q_j=z_j/\\|z_j\\|,\\quad q_1=${vecTex(qs[0])},\\ q_2=${vecTex(qs[1])},\\ q_3=${vecTex(qs[2])}`;
  }
  if (zs[step - 1].length() < 1e-5) {
    return `z_${step}=0,\\quad x_${step}\\text{ already lies in }\\operatorname{span}\\{z_1,\\ldots,z_{${step - 1}}\\}`;
  }
  if (step === 1) return `z_1=x_1=${vecTex(zs[0])}`;
  const x = xs[step - 1];
  const removed = zs.slice(0, step - 1).map((z) => {
    const coeff = x.dot(z) / z.dot(z);
    return vecTex(z.clone().multiplyScalar(coeff));
  });
  const checks = zs.slice(0, step - 1).map((z, j) => `\\langle z_${j + 1},z_${step}\\rangle=${fmt(z.dot(zs[step - 1]))}`);
  return `z_${step}=x_${step}-(${removed.join("+")})=${vecTex(zs[step - 1])}\\qquad ${checks.join(",\\ ")}`;
}

export function GramSchmidt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(rows: number[][], step: number) => void>(() => {});
  const [rows, setRows] = useState(NOTES);
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { scene, renderer, controls, resize } = createStage(
      canvas,
      new THREE.Vector3(8.4, 6.4, 9.2),
      new THREE.Vector3(1.1, 1.3, 1.5),
    );
    const originals = [0, 1, 2].map(() => makeShaft(0x6f675e, 0.022));
    const built = [0, 1, 2].map((i) => makeShaft(STEP_COLORS[i], 0.042));
    const shadows = [0, 1].map(() => makeShaft(BLUE, 0.03));
    const closing = makeShaft(COPPER, 0.03);
    const labels = [0, 1, 2, 3, 4, 5].map(() => makeLabel(""));
    [...originals, ...built, ...shadows, closing, ...labels].forEach((object) => scene.add(object));

    const place = (sprite: THREE.Sprite, tip: THREE.Vector3, name: string) => {
      if (tip.length() < 0.08) {
        sprite.visible = false;
        return;
      }
      setLabel(sprite, name);
      sprite.position.copy(tip).addScaledVector(tip.clone().normalize(), 0.42);
    };

    drawRef.current = (nextRows, nextStep) => {
      const sources = nextRows.map((row) => new THREE.Vector3(row[0], row[1], row[2]));
      const { zs, qs } = gramSchmidt(nextRows);
      sources.forEach((vector, i) => {
        setShaft(originals[i], vector);
        place(labels[i], vector, `x${i + 1}`);
      });
      shadows.forEach((shaft) => {
        shaft.visible = false;
      });
      closing.visible = false;
      labels.slice(3).forEach((sprite) => {
        sprite.visible = false;
      });

      const useQ = nextStep === 4;
      const count = nextStep === 0 ? 0 : Math.min(nextStep, 3);
      built.forEach((shaft, i) => {
        const vector = useQ ? qs[i] : zs[i];
        if (i < count) {
          setShaft(shaft, vector);
          place(labels[3 + i], vector, useQ ? `q${i + 1}` : `z${i + 1}`);
        } else shaft.visible = false;
      });

      if (nextStep >= 2 && nextStep <= 3) {
        const x = sources[nextStep - 1];
        let cursor = new THREE.Vector3();
        for (let j = 0; j < nextStep - 1; j++) {
          const denom = zs[j].dot(zs[j]);
          if (denom < 1e-10) continue;
          const proj = zs[j].clone().multiplyScalar(x.dot(zs[j]) / denom);
          if (proj.length() < 1e-4) continue;
          setShaft(shadows[j], proj, cursor);
          cursor = cursor.clone().add(proj);
        }
        const side = x.clone().sub(cursor);
        setShaft(closing, side, cursor);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, controls.object as THREE.PerspectiveCamera);
    };
    loop();
    const stopTheme = watchTheme(() => recolor(scene));
    return () => {
      stopTheme();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      [...originals, ...built, ...shadows, closing].forEach(disposeShaft);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    drawRef.current(rows, step);
  }, [rows, step]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((current) => {
        if (current >= 4) {
          setPlaying(false);
          return 4;
        }
        return current + 1;
      });
    }, 1600);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <figure className={styles.figure}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label="Gram-Schmidt orthogonalization of three vectors" />
      <div className={styles.steps}>
        {["Vectors", "z₁", "z₂", "z₃", "Normalize"].map((label, index) => (
          <button
            key={label}
            type="button"
            className={styles.text}
            aria-pressed={step === index}
            onClick={() => {
              setPlaying(false);
              setStep(index);
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={styles.text}
          aria-pressed={playing}
          onClick={() => {
            setStep(0);
            setPlaying(true);
          }}
        >
          {playing ? "Stop" : "Play"}
        </button>
        <button
          type="button"
          className={styles.text}
          onClick={() => {
            setPlaying(false);
            setRows(NOTES.map((row) => [...row]));
            setStep(1);
          }}
        >
          Notes
        </button>
      </div>
      <div className={styles.inline}>
        {rows.map((row, i) => (
          <span key={i} className={styles.vec}>
            x{i + 1} (
            {row.map((value, j) => (
              <input
                key={j}
                className={styles.num}
                type="number"
                step={0.5}
                value={value}
                aria-label={`x${i + 1} component ${j + 1}`}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) return;
                  setPlaying(false);
                  setRows((prev) => prev.map((item, ii) => (ii === i ? item.map((entry, jj) => (jj === j ? next : entry)) : item)));
                }}
              />
            ))}
            )
          </span>
        ))}
      </div>
      <div className={styles.formula}>
        <Tex source={formulaFor(rows, step)} display />
      </div>
      <figcaption className={styles.caption}>
        Pale arrows are the original vectors. At each step the blue pieces are the shadows subtracted, laid head to tail, and the copper side is what remains. That side is the new vector, and the inner products under the picture are the check that it is orthogonal to the ones already built. The notes&apos; triple has <Tex source="\|z_j\|=3" />.
      </figcaption>
    </figure>
  );
}
