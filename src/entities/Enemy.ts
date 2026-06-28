import { TAU, clamp, rand } from "../core/utils";
import type { Bullet, EnemyKind } from "./types";

interface EnemyConfig {
  size: number;
  hp: number;
  baseSpeed: number;
  score: number;
  body: [string, string];
  glow: string;
  canShoot: boolean;
  fireRate: [number, number];
  shots: number;
}

// Sizes are 2.5x their original design value — bigger, more imposing villains.
const CONFIG: Record<EnemyKind, EnemyConfig> = {
  scuttler: { size: 80, hp: 1, baseSpeed: 90, score: 10, body: ["#7a3a7a", "#2a0e33"], glow: "#ff5d5d", canShoot: false, fireRate: [0, 0], shots: 0 },
  stinger: { size: 75, hp: 2, baseSpeed: 112, score: 16, body: ["#ffe066", "#a88200"], glow: "#ffd23f", canShoot: true, fireRate: [1.4, 2.6], shots: 1 },
  warden: { size: 105, hp: 3, baseSpeed: 88, score: 22, body: ["#6b3fd6", "#1c0a44"], glow: "#8a5dff", canShoot: false, fireRate: [0, 0], shots: 0 },
  reaper: { size: 125, hp: 5, baseSpeed: 58, score: 32, body: ["#525a64", "#15171a"], glow: "#ff3d5d", canShoot: true, fireRate: [0.9, 1.6], shots: 2 },
};

export class Enemy {
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  speed: number;
  score: number;
  kind: EnemyKind;
  dead = false;
  hitFlash = 0;

  private cfg: EnemyConfig;
  private t = 0;
  private phase = rand(0, TAU);
  private amp: number;
  private fireCd: number;
  private baseX: number;
  private legPhase = rand(0, TAU);

  constructor(x: number, y: number, kind: EnemyKind, speedMul: number, hpMul: number) {
    this.kind = kind;
    this.cfg = CONFIG[kind];
    this.x = x;
    this.baseX = x;
    this.y = y;
    this.size = this.cfg.size;
    this.hp = Math.max(1, Math.round(this.cfg.hp * hpMul));
    this.maxHp = this.hp;
    this.speed = this.cfg.baseSpeed * speedMul;
    this.score = this.cfg.score;
    this.amp = rand(36, 84);
    this.fireCd = rand(this.cfg.fireRate[0] || 1, this.cfg.fireRate[1] || 2);
  }

  update(dt: number, w: number, h: number, playerX: number, playerY: number, fire: (b: Bullet) => void): boolean {
    this.t += dt;
    this.legPhase += dt * 6;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    switch (this.kind) {
      case "scuttler":
        this.y += this.speed * dt;
        this.x = this.baseX + Math.sin(this.t * 1.6 + this.phase) * this.amp * 0.35;
        break;
      case "stinger":
        this.y += this.speed * dt;
        this.x = this.baseX + Math.sin(this.t * 2.4 + this.phase) * this.amp;
        break;
      case "warden": {
        this.y += this.speed * dt * (this.y < h * 0.35 ? 1 : 1.8);
        const dx = playerX - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 1.1 * dt);
        break;
      }
      case "reaper":
        this.y += this.speed * dt;
        this.x = this.baseX + Math.sin(this.t * 1.1 + this.phase) * (this.amp * 0.5);
        break;
    }
    this.x = clamp(this.x, this.size / 2, w - this.size / 2);

    if (this.cfg.canShoot && playerY > this.y) {
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        this.fireCd = rand(this.cfg.fireRate[0], this.cfg.fireRate[1]);
        const a = Math.atan2(playerY - this.y, playerX - this.x);
        for (let i = 0; i < this.cfg.shots; i++) {
          const spread = this.cfg.shots > 1 ? (i - (this.cfg.shots - 1) / 2) * 0.25 : 0;
          fire({
            x: this.x,
            y: this.y + this.size / 2,
            vx: Math.cos(a + spread) * 230,
            vy: Math.sin(a + spread) * 230,
            r: 5,
            friendly: false,
            damage: 1,
            color: this.cfg.glow,
            life: 6,
          });
        }
      }
    }

    return this.y - this.size / 2 > h;
  }

  get color(): string {
    return this.cfg.glow;
  }

  hit(dmg: number): boolean {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const bodyFill = this.hitFlash > 0 ? "#ffffff" : this.bodyGradient(ctx, s);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.cfg.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;

    switch (this.kind) {
      case "scuttler": {
        // Crab-like crawler: dark carapace, glowing red eyes, mandibles, animated legs.
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.38, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 8;
        ctx.fillStyle = this.cfg.glow;
        ctx.beginPath();
        ctx.arc(-s * 0.14, -s * 0.06, s * 0.07, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.14, -s * 0.06, s * 0.07, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = this.cfg.glow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, s * 0.22);
        ctx.quadraticCurveTo(-s * 0.22, s * 0.42, -s * 0.04, s * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.22);
        ctx.quadraticCurveTo(s * 0.22, s * 0.42, s * 0.04, s * 0.4);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i += 2) {
          for (let j = 0; j < 2; j++) {
            const ly = -s * 0.1 + j * s * 0.22;
            const wig = Math.sin(this.legPhase + j * 2) * 4;
            ctx.beginPath();
            ctx.moveTo(i * s * 0.42, ly);
            ctx.lineTo(i * s * 0.6, ly + wig);
            ctx.stroke();
          }
        }
        break;
      }

      case "stinger": {
        // Wasp-like gunner: striped abdomen, stinger tail, antennae, compound eyes.
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = "rgba(40,20,0,0.6)";
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.28, s * 0.5, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(20,10,0,0.55)";
        ctx.lineWidth = 3;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(-s * 0.26, s * (0.05 + k * 0.18));
          ctx.lineTo(s * 0.26, s * (0.05 + k * 0.18));
          ctx.stroke();
        }

        ctx.fillStyle = this.cfg.glow;
        ctx.beginPath();
        ctx.moveTo(-s * 0.08, s * 0.5);
        ctx.lineTo(s * 0.08, s * 0.5);
        ctx.lineTo(0, s * 0.74);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = bodyFill;
        ctx.beginPath();
        ctx.arc(0, -s * 0.42, s * 0.18, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 8;
        ctx.fillStyle = "#1a1000";
        ctx.beginPath();
        ctx.arc(-s * 0.07, -s * 0.44, s * 0.05, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.07, -s * 0.44, s * 0.05, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = this.cfg.glow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.06, -s * 0.56);
        ctx.lineTo(-s * 0.18, -s * 0.74);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.06, -s * 0.56);
        ctx.lineTo(s * 0.18, -s * 0.74);
        ctx.stroke();
        break;
      }

      case "warden": {
        // Armored squid-like brute: domed head, single huge eye, trailing tentacles.
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s * 0.42, Math.PI, 0);
        ctx.lineTo(s * 0.42, s * 0.05);
        ctx.lineTo(-s * 0.42, s * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 16;
        ctx.shadowColor = this.cfg.glow;
        const eyeR = s * 0.16;
        const eg = ctx.createRadialGradient(0, -s * 0.12, 0, 0, -s * 0.12, eyeR);
        eg.addColorStop(0, "#ffffff");
        eg.addColorStop(0.4, this.cfg.glow);
        eg.addColorStop(1, "#1a0a33");
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(0, -s * 0.12, eyeR, 0, TAU);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = bodyFill;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        for (let i = -1; i <= 1; i++) {
          const tx = i * s * 0.22;
          ctx.beginPath();
          ctx.moveTo(tx, s * 0.05);
          ctx.quadraticCurveTo(tx + Math.sin(this.t * 3 + i) * 10, s * 0.4, tx * 0.6 + Math.sin(this.t * 3 + i + 1) * 14, s * 0.64);
          ctx.stroke();
        }
        break;
      }

      case "reaper": {
        // Heavy gunner: metallic torso, skull-slit visor, twin shoulder cannons.
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.roundRect(-s * 0.38, -s * 0.42, s * 0.76, s * 0.84, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.roundRect(-s * 0.22, -s * 0.3, s * 0.44, s * 0.3, 6);
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.cfg.glow;
        ctx.fillStyle = this.cfg.glow;
        ctx.fillRect(-s * 0.18, -s * 0.2, s * 0.14, s * 0.05);
        ctx.fillRect(s * 0.04, -s * 0.2, s * 0.14, s * 0.05);

        ctx.shadowBlur = 0;
        ctx.fillStyle = bodyFill;
        ctx.fillRect(-s * 0.58, -s * 0.1, s * 0.2, s * 0.36);
        ctx.fillRect(s * 0.38, -s * 0.1, s * 0.2, s * 0.36);

        ctx.shadowBlur = 8;
        ctx.shadowColor = this.cfg.glow;
        ctx.fillStyle = this.cfg.glow;
        ctx.beginPath();
        ctx.arc(-s * 0.48, s * 0.26, s * 0.05, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.48, s * 0.26, s * 0.05, 0, TAU);
        ctx.fill();
        break;
      }
    }
    ctx.restore();

    if (this.maxHp > 1 && this.hp > 0) {
      const bw = s;
      const bx = this.x - bw / 2;
      const by = this.y - s / 2 - 9;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = this.cfg.glow;
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 4);
      ctx.restore();
    }
  }

  private bodyGradient(ctx: CanvasRenderingContext2D, s: number): CanvasGradient {
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
    g.addColorStop(0, this.cfg.body[0]);
    g.addColorStop(1, this.cfg.body[1]);
    return g;
  }
}
