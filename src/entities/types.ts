export type EnemyKind = "grunt" | "weaver" | "diver" | "tank";
export type PowerKind = "rapid" | "spread" | "shield";

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
}
