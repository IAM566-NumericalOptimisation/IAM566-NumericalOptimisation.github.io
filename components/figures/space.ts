// A small three.js stage for the 3-D figures in the kit's style.
//   createSpace   renderer, camera with x3 up, orbit controls, axes, LaTeX labels
//   space.paint   a material whose colour follows a CSS variable through theme changes
//   space.arrow   a solid arrow (shaft and head) that can be re-aimed every frame
//   space.label   a KaTeX label pinned to a point, coloured by CSS
//   space.line    a fat polyline whose points can be replaced
// Coordinates are the notes' (x1, x2, x3); the camera's up is x3.
import katex from "katex";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { watchTheme } from "@/components/theme";

export type Role = "ink" | "muted" | "faint" | "teal" | "copper" | "blue" | "violet";

const VARS: Record<Role, string> = {
  ink: "--ink",
  muted: "--muted",
  faint: "--faint",
  teal: "--accent",
  copper: "--copper",
  blue: "--blue",
  violet: "--violet",
};

/** The current value of a role's CSS variable, read at draw time. */
export function readColor(role: Role) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(VARS[role]).trim();
  return new THREE.Color(value || "#888888");
}

type Paintable = THREE.Material & { color: THREE.Color };

export type Arrow = THREE.Group & { aim: (vector: THREE.Vector3, origin?: THREE.Vector3) => void };
export type Label = CSS2DObject & { setTex: (tex: string) => void };
export type Polyline = Line2 & { setPoints: (points: THREE.Vector3[]) => void };

export type Space = ReturnType<typeof createSpace>;

export function createSpace(
  host: HTMLElement,
  { position, target = new THREE.Vector3(), axis = 2.2, labelClass }: { position: THREE.Vector3; target?: THREE.Vector3; axis?: number; labelClass: string },
) {
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  host.appendChild(canvas);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    canvas.remove();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const labels = new CSS2DRenderer();
  Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 200);
  camera.up.set(0, 0, 1);
  camera.position.copy(position);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.target.copy(target);
  controls.minDistance = position.distanceTo(target) * 0.45;
  controls.maxDistance = position.distanceTo(target) * 2.2;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(5, -4, 9);
  scene.add(sun);

  // every painted material and its role, re-read on a theme change; painting again changes the role
  const painted = new Map<Paintable, Role>();
  const paint = <T extends Paintable>(material: T, role: Role) => {
    if (painted.get(material) !== role) material.color.copy(readColor(role));
    painted.set(material, role);
    return material;
  };
  const resolution = new THREE.Vector2(1, 1);
  const lineMaterials: LineMaterial[] = [];

  const shaftGeometry = new THREE.CylinderGeometry(1, 1, 1, 20);
  const headGeometry = new THREE.ConeGeometry(1, 1, 24);
  const up = new THREE.Vector3(0, 1, 0);

  function arrow(role: Role, radius = 0.035, opacity = 1): Arrow {
    const material = paint(new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, transparent: opacity < 1, opacity }), role);
    const group = new THREE.Group() as Arrow;
    const shaft = new THREE.Mesh(shaftGeometry, material);
    const head = new THREE.Mesh(headGeometry, material);
    group.add(shaft, head);
    group.aim = (vector, origin = new THREE.Vector3()) => {
      const length = vector.length();
      group.visible = length > 1e-4;
      if (!group.visible) return;
      group.position.copy(origin);
      group.quaternion.setFromUnitVectors(up, vector.clone().divideScalar(length));
      const headLength = Math.min(radius * 7, length * 0.4);
      const shaftLength = length - headLength;
      shaft.scale.set(radius, shaftLength, radius);
      shaft.position.set(0, shaftLength / 2, 0);
      head.scale.set(radius * 2.6, headLength, radius * 2.6);
      head.position.set(0, shaftLength + headLength / 2, 0);
    };
    scene.add(group);
    return group;
  }

  function label(tex: string, role: Role, at = new THREE.Vector3()): Label {
    const element = document.createElement("span");
    element.className = labelClass;
    element.style.color = `var(${VARS[role]})`;
    const object = new CSS2DObject(element) as Label;
    let current = "";
    object.setTex = (next) => {
      if (next === current) return;
      current = next;
      element.innerHTML = katex.renderToString(next, { throwOnError: false });
    };
    object.setTex(tex);
    object.position.copy(at);
    scene.add(object);
    return object;
  }

  function line(role: Role, width = 2, { dashed = false, opacity = 1 } = {}): Polyline {
    const material = paint(new LineMaterial({ linewidth: width, dashed, dashSize: 0.14, gapSize: 0.1, transparent: opacity < 1, opacity, worldUnits: false }), role);
    material.resolution.copy(resolution);
    lineMaterials.push(material);
    const object = new Line2(new LineGeometry(), material) as Polyline;
    object.setPoints = (points) => {
      object.geometry.dispose();
      const geometry = new LineGeometry();
      geometry.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
      object.geometry = geometry;
      if (dashed) object.computeLineDistances();
    };
    scene.add(object);
    return object;
  }

  // the axes, faint, with their names
  for (const [i, name] of ["x_1", "x_2", "x_3"].entries()) {
    const dir = new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
    line("faint", 1.2, { opacity: 0.7 }).setPoints([dir.clone().multiplyScalar(-axis), dir.clone().multiplyScalar(axis)]);
    label(name, "faint", dir.clone().multiplyScalar(axis + 0.3));
  }

  const resize = () => {
    const w = host.clientWidth || 640;
    const h = host.clientHeight || 420;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    resolution.set(w, h);
    for (const m of lineMaterials) m.resolution.copy(resolution);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  // per-frame work (animations); the loop runs only while the figure is on screen
  const frameHooks = new Set<(now: number) => void>();
  let frame = 0;
  let onScreen = true;
  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    for (const hook of frameHooks) hook(now);
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  };
  frame = requestAnimationFrame(loop);
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === onScreen) return;
    onScreen = entry.isIntersecting;
    cancelAnimationFrame(frame);
    if (onScreen) frame = requestAnimationFrame(loop);
  });
  visibility.observe(host);

  const stopTheme = watchTheme(() => {
    for (const [material, role] of painted) material.color.copy(readColor(role));
  });

  function dispose() {
    cancelAnimationFrame(frame);
    frameHooks.clear();
    visibility.disconnect();
    observer.disconnect();
    stopTheme();
    painted.clear();
    controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      const m = mesh.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => materials.add(x));
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    labels.domElement.remove();
    canvas.remove();
  }

  return { scene, camera, controls, paint, arrow, label, line, frameHooks, dispose };
}

/** Mount a space into a host element; returns null (and the figure shows its fallback) when WebGL is unavailable. */
export function tryCreateSpace(host: HTMLElement, options: Parameters<typeof createSpace>[1]) {
  try {
    return createSpace(host, options);
  } catch {
    return null;
  }
}

/** A translucent flat disc of radius r through `center` with unit normal `normal`. */
export function disc(space: Space, role: Role, r: number, normal: THREE.Vector3, opacity = 0.18) {
  const material = space.paint(
    new THREE.MeshStandardMaterial({ transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, roughness: 1, metalness: 0 }),
    role,
  );
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 96), material);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
  space.scene.add(mesh);
  return mesh;
}

export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
