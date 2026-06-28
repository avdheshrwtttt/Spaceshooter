import type { EnemyKind } from "../entities/types";

export interface LevelConfig {
  index: number;
  galaxy: string;
  duration: number;
  kinds: EnemyKind[];
  speedMul: number;
  hpMul: number;
  spawnInterval: number;
  tint: [number, number, number];
  isBoss: boolean;
}

export const LEVELS: LevelConfig[] = [
  {
    index: 1,
    galaxy: "Milky Way Galaxy",
    duration: 20,
    kinds: ["scuttler"],
    speedMul: 1,
    hpMul: 1,
    spawnInterval: 1.0,
    tint: [70, 50, 170],
    isBoss: false,
  },
  {
    index: 2,
    galaxy: "Andromeda Galaxy",
    duration: 20,
    kinds: ["scuttler", "stinger"],
    speedMul: 1.18,
    hpMul: 1.1,
    spawnInterval: 0.85,
    tint: [40, 90, 190],
    isBoss: false,
  },
  {
    index: 3,
    galaxy: "Spiral Galaxy",
    duration: 20,
    kinds: ["stinger", "warden"],
    speedMul: 1.34,
    hpMul: 1.25,
    spawnInterval: 0.72,
    tint: [30, 140, 150],
    isBoss: false,
  },
  {
    index: 4,
    galaxy: "Whirlpool Galaxy",
    duration: 20,
    kinds: ["warden", "reaper"],
    speedMul: 1.5,
    hpMul: 1.4,
    spawnInterval: 0.6,
    tint: [20, 100, 190],
    isBoss: false,
  },
  {
    index: 5,
    galaxy: "Cartwheel Galaxy",
    duration: Infinity,
    kinds: [],
    speedMul: 1.6,
    hpMul: 1,
    spawnInterval: 0,
    tint: [190, 80, 30],
    isBoss: true,
  },
];
