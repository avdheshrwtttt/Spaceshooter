import type { BossTheme, EnemyKind } from "../entities/types";

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
  boss: BossTheme;
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
    boss: { name: "MILKY WAY SENTINEL", mid: "#8a5dff", light: "#d9c9ff", dark: "#1c0a44", hpBase: 46, speedBase: 68, pods: 4 },
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
    boss: { name: "ANDROMEDA DEVOURER", mid: "#3fd1ff", light: "#cdf4ff", dark: "#04263d", hpBase: 64, speedBase: 80, pods: 4 },
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
    boss: { name: "SPIRAL MARAUDER", mid: "#2fe0c0", light: "#cdfff0", dark: "#04332b", hpBase: 86, speedBase: 92, pods: 5 },
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
    boss: { name: "WHIRLPOOL LEVIATHAN", mid: "#4a7dff", light: "#cfe0ff", dark: "#06173d", hpBase: 116, speedBase: 104, pods: 6 },
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
    boss: { name: "CARTWHEEL OVERLORD", mid: "#ff8a3d", light: "#ffcf9e", dark: "#5c0a00", hpBase: 72, speedBase: 86, pods: 6 },
  },
];
