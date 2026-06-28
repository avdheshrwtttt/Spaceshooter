import { TAU, rand, pick } from "../core/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
  glow: number;
  gravity: number;
  shrink: boolean;
}

/** Additive-blended particle system for explosions, sparks and thruster trails. */
export class Particles {
  private pool: Particle[] = [];

  private add(p: Particle) {
    this.pool.push(p);
  }

  burst(x: number, y: number, opts: { count?: number; colors?: string[]; speed?: number; big?: boolean } = {}) {
    const count = opts.count ?? 18;
    const colors = opts.colors ?? ["#ff7a18", "#ff3d3d", "#ffb020", "#ffe066"];
    const speed = opts.speed ?? 3;
    for (let i = 0; i < count; i++) {
      const a = (TAU / count) * i + rand(-0.3, 0.3);
      const sp = rand(0.4, 1) * speed * (opts.big ? 1.6 : 1);
      const life = rand(0.4, 0.9) * (opts.big ? 1.4 : 1);
      this.add({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1.6, 3.4) * (opts.big ? 1.5 : 1),
        life,
        maxLife: life,
        color: pick(colors),
        glow: 8,
        gravity: 0,
        shrink: true,
      });
    }
  }

  spark(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const a = rand(0, TAU);
      const sp = rand(0.5, 2.5);
      const life = rand(0.2, 0.45);
      this.add({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1, 2),
        life, maxLife: life,
        color, glow: 6, gravity: 0, shrink: true,
      });
    }
  }

  thruster(x: number, y: number, intensity: number) {
    if (Math.random() > intensity) return;
    const life = rand(0.18, 0.4);
    this.add({
      x: x + rand(-2, 2),
      y,
      vx: rand(-0.4, 0.4),
      vy: rand(2.5, 4.5),
      r: rand(1.5, 3.5),
      life, maxLife: life,
      color: pick(["#38e8ff", "#9af6ff", "#2a7bff", "#bff4ff"]),
      glow: 10, gravity: 0, shrink: true,
    });
  }

  update(dt: number) {
    const f = dt * 60; // normalise to per-frame physics tuned at 60fps
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.vx *= Math.pow(0.95, f);
      p.vy = p.vy * Math.pow(0.95, f) + p.gravity * f;
      p.life -= dt;
      if (p.life <= 0) this.pool.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.pool) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, t);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.shrink ? p.r * t + 0.3 : p.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.pool.length = 0;
  }

  get count() {
    return this.pool.length;
  }
}
