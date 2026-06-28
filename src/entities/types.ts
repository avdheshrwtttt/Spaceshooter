export type EnemyKind = "scuttler" | "stinger" | "warden" | "reaper";
export type PowerKind = "rapid" | "spread" | "shield" | "aegis";

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  friendly: boolean;
  damage: number;
  color: string;
  life: number;
  len?: number; // visual streak length for friendly bullets; defaults to 14
}

/** Visual + difficulty profile for a per-galaxy boss encounter. */
export interface BossTheme {
  name: string;
  mid: string;
  light: string;
  dark: string;
  hpBase: number;
  speedBase: number;
  pods: number;
}
