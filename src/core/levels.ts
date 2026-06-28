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
    speedMul: 0.8,
    hpMul: 1,
    spawnInterval: 1.3,
    tint: [70, 50, 170],
    isBoss: false,
    boss: { name: "MILKY WAY SENTINEL", kind: "wraith", mid: "#8a5dff", light: "#d9c9ff", dark: "#1c0a44", hpBase: 34, speedBase: 56, pods: 4 },
  },
  {
    index: 2,
    galaxy: "Andromeda Galaxy",
    duration: 20,
    kinds: ["scuttler", "stinger"],
    speedMul: 0.95,
    hpMul: 1,
    spawnInterval: 1.05,
    tint: [40, 90, 190],
    isBoss: false,
    boss: { name: "ANDROMEDA DEVOURER", kind: "specter", mid: "#3fd1ff", light: "#cdf4ff", dark: "#04263d", hpBase: 50, speedBase: 66, pods: 4 },
  },
  {
    index: 3,
    galaxy: "Spiral Galaxy",
    duration: 20,
    kinds: ["stinger", "warden"],
    speedMul: 1.08,
    hpMul: 1.08,
    spawnInterval: 0.9,
    tint: [30, 140, 150],
    isBoss: false,
    boss: { name: "SPIRAL MARAUDER", kind: "golem", mid: "#2fe0c0", light: "#cdfff0", dark: "#04332b", hpBase: 68, speedBase: 76, pods: 5 },
  },
  {
    index: 4,
    galaxy: "Whirlpool Galaxy",
    duration: 20,
    kinds: ["warden", "reaper"],
    speedMul: 1.2,
    hpMul: 1.18,
    spawnInterval: 0.78,
    tint: [20, 100, 190],
    isBoss: false,
    boss: { name: "WHIRLPOOL LEVIATHAN", kind: "leviathan", mid: "#4a7dff", light: "#cfe0ff", dark: "#06173d", hpBase: 92, speedBase: 88, pods: 6 },
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
    boss: { name: "CARTWHEEL OVERLORD", kind: "overlord", mid: "#ffd24a", light: "#fff3c2", dark: "#3a0a4a", hpBase: 72, speedBase: 86, pods: 6 },
  },
];
