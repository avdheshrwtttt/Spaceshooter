# 🚀 Nebula Strike

A premium browser **space shooter** built with **TypeScript + HTML5 Canvas** and zero gameplay dependencies. Fly through a living galaxy, hold the line against escalating waves, and take down dreadnought bosses while chasing a high score.

![Made with TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![No deps](https://img.shields.io/badge/runtime%20deps-0-success)

---

## ✨ Features

- **Living galaxy background** — three parallax star layers, drifting nebula clouds, and random shooting stars.
- **Juicy game feel** — trauma-based screen shake, additive-blended particle explosions, engine thruster trails, ship banking, muzzle flashes, and floating score pop-ups.
- **Wave + boss progression** — endless escalating waves; every 5th wave is a **Dreadnought boss** with three rotating bullet-hell attack patterns and a rage phase.
- **Enemy variety** — grunts, sine-wave weavers, player-seeking divers, and armored tanks, each with its own movement and shape.
- **Power-ups** — ⚡ Rapid Fire, ✸ Spread shot (stacks to a 5-way), and ❖ Shield.
- **Combo scoring** — chain kills for a rising multiplier; getting hit breaks the streak.
- **Procedural audio** — every sound effect and the looping chiptune soundtrack are synthesized live with the Web Audio API (no audio files).
- **Responsive + mobile** — scales to any screen, supports keyboard *and* touch (drag to steer, auto-fire).
- **Persistent high score** via `localStorage`.

## 🎮 Controls

| Action | Keyboard | Touch |
| ------ | -------- | ----- |
| Move   | `←` `→` or `A` `D` | Drag anywhere |
| Fire   | `Space` | Auto-fire while touching |
| Pause  | `P` or `Esc` | — |

## 🛠️ Tech stack

- **TypeScript** (strict mode) for a fully typed, modular engine
- **HTML5 Canvas 2D** with a delta-time game loop (frame-rate independent)
- **Vite** for dev server + production bundling
- **Web Audio API** for synthesized SFX and music
- No game frameworks, no runtime dependencies — the production bundle is ~11 KB gzipped.

## 🚀 Getting started

```bash
npm install      # install dev tooling (Vite + TypeScript)
npm run dev      # start the dev server → http://localhost:5173
npm run build    # type-check + produce an optimized build in dist/
npm run preview  # preview the production build locally
```

## ☁️ Deploying to Vercel

This repo is preconfigured for Vercel (`vercel.json`).

**Option A — Dashboard:** push this repo to GitHub, then "Import Project" on [vercel.com](https://vercel.com). Vercel auto-detects Vite; no settings needed.

**Option B — CLI:**

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

Build command: `npm run build` · Output directory: `dist`.

## 📁 Project structure

```
src/
├─ main.ts              # entry point
├─ style.css            # menu / HUD overlay styling
├─ core/
│  ├─ Game.ts           # state machine, game loop, collisions, waves
│  ├─ audio.ts          # procedural SFX + chiptune BGM
│  ├─ input.ts          # keyboard + touch input
│  └─ utils.ts          # math helpers
├─ entities/
│  ├─ Player.ts  Enemy.ts  Boss.ts  Powerup.ts  types.ts
├─ fx/
│  ├─ Starfield.ts  Particles.ts  ScreenShake.ts  FloatingText.ts
└─ ui/
   └─ HUD.ts            # on-canvas heads-up display
```

## 📜 License

MIT — built for a game-development competition.
