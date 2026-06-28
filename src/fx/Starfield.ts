import { TAU, rand } from "../core/utils";

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
  hue: number;
  light: number;
  twinkle: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

/** Parallax galaxy background: drifting nebula clouds, 3 star layers, shooting stars. */
export class Starfield {
  private layers: Star[][] = [];
  private shooting: ShootingStar[] = [];
  private nebula = 0;
  private t = 0;
  private nextShoot = rand(2, 5);
  private tint: [number, number, number] = [70, 50, 170];

  constructor(private w: number, private h: number) {
    this.regen();
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.regen();
  }

  /** Tints the drifting nebula clouds to match the current galaxy/level. */
  setTint(rgb: [number, number, number]) {
    this.tint = rgb;
  }

  private regen() {
    const make = (n: number, conf: { r: [number, number]; speed: number; hue: [number, number]; light: [number, number] }) =>
      Array.from({ length: n }, () => ({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: rand(conf.r[0], conf.r[1]),
        speed: conf.speed,
        hue: rand(conf.hue[0], conf.hue[1]),
        light: rand(conf.light[0], conf.light[1]),
        twinkle: Math.random() * TAU,
      }));
    const density = Math.max(0.5, (this.w * this.h) / (1280 * 720));
    this.layers = [
      make(Math.round(120 * density), { r: [0.2, 0.8], speed: 8, hue: [200, 260], light: [70, 100] }),
      make(Math.round(80 * density), { r: [0.4, 1.4], speed: 22, hue: [180, 260], light: [80, 100] }),
      make(Math.round(36 * density), { r: [0.8, 2.3], speed: 46, hue: [190, 320], light: [90, 100] }),
    ];
  }

  update(dt: number, speedMul = 1) {
    this.t += dt;
    this.nebula += dt * 0.12;
    for (const layer of this.layers) {
      for (const s of layer) {
        s.y += s.speed * speedMul * dt;
        if (s.y > this.h + s.r) {
          s.y = -s.r;
          s.x = Math.random() * this.w;
        }
      }
    }
    // shooting stars
    this.nextShoot -= dt;
    if (this.nextShoot <= 0) {
      this.nextShoot = rand(2.5, 7);
      const fromLeft = Math.random() < 0.5;
      this.shooting.push({
        x: fromLeft ? rand(0, this.w * 0.4) : rand(this.w * 0.6, this.w),
        y: rand(0, this.h * 0.4),
        vx: (fromLeft ? 1 : -1) * rand(380, 620),
        vy: rand(220, 420),
        life: 1,
        len: rand(80, 160),
      });
    }
    for (let i = this.shooting.length - 1; i >= 0; i--) {
      const s = this.shooting[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt * 1.2;
      if (s.life <= 0) this.shooting.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this;

    // Deep-space vertical gradient — near-black so the galaxy reads as dark void.
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#000000");
    bg.addColorStop(0.35, "#020108");
    bg.addColorStop(0.7, "#030109");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Drifting nebula clouds, faint and tinted to the current galaxy.
    const [tr, tg, tb] = this.tint;
    this.cloud(ctx, w * 0.26 + Math.sin(this.nebula * 0.4) * 36, h * 0.34 + Math.cos(this.nebula * 0.3) * 24, w * 0.42, [tr, tg, tb]);
    this.cloud(ctx, w * 0.74 + Math.cos(this.nebula * 0.35) * 30, h * 0.56 + Math.sin(this.nebula * 0.45) * 18, w * 0.4, [tb, tr, tg]);
    this.cloud(ctx, w * 0.52 + Math.sin(this.nebula * 0.25) * 44, h * 0.16 + Math.cos(this.nebula * 0.2) * 14, w * 0.34, [tg, tb, tr]);

    // Stars.
    for (let li = 0; li < this.layers.length; li++) {
      const layer = this.layers[li];
      for (const s of layer) {
        const a = 0.55 + 0.45 * Math.sin(this.t * 3 + s.twinkle);
        ctx.globalAlpha = a;
        if (s.r > 1.2) {
          ctx.shadowColor = `hsl(${s.hue} 80% ${s.light}%)`;
          ctx.shadowBlur = s.r * 3;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `hsl(${s.hue} 70% ${s.light}%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Shooting stars.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of this.shooting) {
      const len = s.len;
      const ux = -s.vx;
      const uy = -s.vy;
      const m = Math.hypot(ux, uy) || 1;
      const tx = s.x + (ux / m) * len;
      const ty = s.y + (uy / m) * len;
      const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, `rgba(180,240,255,${s.life})`);
      grad.addColorStop(1, "rgba(180,240,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.shadowColor = "#bff4ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  private cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, [cr, cg, cb]: number[]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.1)`);
    g.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.04)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}
