import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const INK = 0x1c1b18;
export const GREEN = 0x1d4e48;
export const COPPER = 0x8a3e2a;
export const BLUE = 0x2c4a6e;

const DARK_HEX: Record<number, number> = {
  0x1c1b18: 0xece8df,
  0x1d4e48: 0x8fbfb6,
  0x8a3e2a: 0xe0a08c,
  0x2c4a6e: 0x9eb9dc,
  0x6f675e: 0xc4beb4,
  0x8a8175: 0xc4beb4,
};

export function themeHex(color: number) {
  if (typeof document === "undefined" || document.documentElement.dataset.theme !== "dark") return color;
  return DARK_HEX[color] ?? color;
}

export function setThemeColor(material: THREE.Material, logical: number) {
  material.userData.base = logical;
  if ("color" in material) (material as THREE.MeshStandardMaterial).color.set(themeHex(logical));
}

export function recolor(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    const mats = mesh.material;
    const list = !mats ? [] : Array.isArray(mats) ? mats : [mats];
    for (const mat of list) {
      const base = mat.userData.base;
      if (typeof base === "number" && "color" in mat) {
        (mat as THREE.MeshStandardMaterial).color.set(themeHex(base));
      }
    }
    if ((node as THREE.Sprite).isSprite && node.userData.text) paintLabel(node as THREE.Sprite);
  });
}

export function createStage(
  canvas: HTMLCanvasElement,
  position: THREE.Vector3,
  target = new THREE.Vector3(),
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
  camera.position.copy(position);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.copy(target);
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 28;
  scene.add(new THREE.AmbientLight(0xffffff, 0.82));
  const dir = new THREE.DirectionalLight(0xffffff, 0.95);
  dir.position.set(4, 7, 5);
  scene.add(dir);
  scene.add(axes(2.15));

  const resize = () => {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 420;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  return { scene, camera, renderer, controls, resize };
}

function axes(length: number) {
  const group = new THREE.Group();
  const specs: Array<[THREE.Vector3, number, string]> = [
    [new THREE.Vector3(1, 0, 0), COPPER, "x₁"],
    [new THREE.Vector3(0, 1, 0), GREEN, "x₂"],
    [new THREE.Vector3(0, 0, 1), BLUE, "x₃"],
  ];
  for (const [dir, color, text] of specs) {
    const shaft = makeShaft(color, 0.018);
    setShaft(shaft, dir.clone().multiplyScalar(length));
    group.add(shaft);
    const sprite = label(text, "#5e5a52");
    sprite.position.copy(dir.clone().multiplyScalar(length + 0.38));
    group.add(sprite);
  }
  return group;
}

function paintLabel(sprite: THREE.Sprite) {
  const map = (sprite.material as THREE.SpriteMaterial).map;
  const canvas = map?.image as HTMLCanvasElement | undefined;
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas || !map) return;
  const dark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = sprite.userData.fill === "faint" ? (dark ? "#b0aba0" : "#5e5a52") : dark ? "#ece8df" : "#1c1b18";
  ctx.font = "64px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(sprite.userData.text ?? ""), canvas.width / 2, canvas.height / 2);
  map.needsUpdate = true;
}

function label(text: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const material = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.78, 0.39, 1);
  sprite.userData.text = text;
  sprite.userData.fill = color === "#5e5a52" ? "faint" : "ink";
  paintLabel(sprite);
  return sprite;
}

export function makeLabel(text: string) {
  return label(text, "#1c1b18");
}

export function setLabel(sprite: THREE.Sprite, text: string) {
  sprite.visible = true;
  if (sprite.userData.text === text) return;
  sprite.userData.text = text;
  sprite.userData.fill = "ink";
  paintLabel(sprite);
}

export function makeArrow(color: number) {
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.16, 0.08);
  const mats = [arrow.line.material, arrow.cone.material].flat();
  for (const mat of mats) setThemeColor(mat, color);
  return arrow;
}

export function setArrow(arrow: THREE.ArrowHelper, vector: THREE.Vector3, origin = new THREE.Vector3()) {
  const length = vector.length();
  arrow.position.copy(origin);
  if (length < 1e-5) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;
  arrow.setDirection(vector.clone().normalize());
  arrow.setLength(length, Math.min(0.22, Math.max(0.08, length * 0.16)), Math.min(0.12, Math.max(0.04, length * 0.08)));
}

export function fmt(n: number) {
  if (!Number.isFinite(n)) return "\\infty";
  const rounded = Math.round(n * 1000) / 1000;
  if (Object.is(rounded, -0)) return "0";
  return String(rounded);
}

export function pretty(n: number) {
  const named: Array<[number, string]> = [
    [0, "0"],
    [1, "1"],
    [-1, "-1"],
    [0.5, "\\tfrac12"],
    [-0.5, "-\\tfrac12"],
    [1 / 3, "\\tfrac13"],
    [-1 / 3, "-\\tfrac13"],
    [2 / 3, "\\tfrac23"],
    [-2 / 3, "-\\tfrac23"],
  ];
  for (const [value, tex] of named) {
    if (Math.abs(n - value) < 5e-4) return tex;
  }
  return fmt(n);
}

export function makeShaft(color: number, radius = 0.035) {
  const material = new THREE.MeshStandardMaterial({ color: themeHex(color), roughness: 0.46, metalness: 0 });
  material.userData.base = color;
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 20), material));
  group.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 2.7, 1, 20), material));
  return group;
}

export function setShaft(group: THREE.Group, vector: THREE.Vector3, origin = new THREE.Vector3()) {
  const length = vector.length();
  if (length < 1e-4) {
    group.visible = false;
    return;
  }
  group.visible = true;
  group.position.copy(origin);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize());
  const headLen = Math.min(0.26, Math.max(0.1, length * 0.2));
  const shaftLen = Math.max(length - headLen, 0.001);
  const shaft = group.children[0] as THREE.Mesh;
  const head = group.children[1] as THREE.Mesh;
  shaft.scale.set(1, shaftLen, 1);
  shaft.position.set(0, shaftLen / 2, 0);
  head.scale.set(1, headLen, 1);
  head.position.set(0, shaftLen + headLen / 2, 0);
}

export function disposeShaft(group: THREE.Group) {
  const material = (group.children[0] as THREE.Mesh).material as THREE.Material;
  group.traverse((node) => {
    (node as THREE.Mesh).geometry?.dispose();
  });
  material.dispose();
}
