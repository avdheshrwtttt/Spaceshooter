// Small shared helpers for the game engine.

export const TAU = Math.PI * 2;

export const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const randInt = (min: number, max: number): number =>
  Math.floor(rand(min, max + 1));

export const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent smoothing factor. `rate` ≈ how fast to approach. */
export const damp = (a: number, b: number, rate: number, dt: number): number =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

/** Axis-aligned circle/box overlap test used for most collisions. */
export const circleRectHit = (
  cx: number,
  cy: number,
  cr: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean => {
  const nx = clamp(cx, rx - rw / 2, rx + rw / 2);
  const ny = clamp(cy, ry - rh / 2, ry + rh / 2);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= cr * cr;
};

export interface Vec2 {
  x: number;
  y: number;
}

/** "#38e8ff" -> [56, 232, 255] for building rgba() strings from theme colors. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
