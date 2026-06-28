import { TAU, rand } from "../core/utils";
import type { Bullet, EnemyKind } from "./types";

interface EnemyConfig {
  size: number;
  hp: number;
  speed: number;
  score: number;
  color: [string, string];
  glow: string;
  canShoot: boolean;
}

const CONFIG: Record<EnemyKind, EnemyConfig> = {
  grunt: { size: 30, hp: 1, speed: 95, score: 10, color: ["#ff8a8a", "#aa1414"], glow: "#ff4d4d", canShoot: false },
  weaver: { size: 28, hp: 2, speed: 80, score: 15, color: ["#ffd27a", "#b96a00"], glow: "#ffb020", canShoot: true },
  diver: { size: 26, hp: 1, speed: 70, score: 20, color: ["#b69bff", "#5826c4"], glow: "#9a6bff", canShoot: false },
  tank: { size: 44, hp: 5, speed: 50, score: 30, color: ["#7affc6", "#0c8a55"], glow: "#3affa0", canShoot: true },
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
  private spin = rand(-2, 2);
  private rot = 0;

  constructor(x: number, y: number, kind: EnemyKind, level: number) {
    this.kind = kind;
    this.cfg = CONFIG[kind];
    this.x = x;
    this.baseX = x;
    this.y = y;
    this.size = this.cfg.size;
    this.hp = this.cfg.hp + (kind === "tank" ? Math.floor(level / 3) : 0);
    this.maxHp = this.hp;
    this.speed = this.cfg.speed + level * 4;
    this.score = this.cfg.score;
    this.amp = rand(40, 90);
    this.fireCd = rand(1, 2.5);
  }

  update(dt: number, w: number, h: number, playerX: number, playerY: number, fire: (b: Bullet) => void): boolean {
    this.t += dt;
    this.rot += this.spin * dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    switch (this.kind) {
      case "grunt":
        this.y += this.speed * dt;
        break;
      case "weaver":
        this.y += this.speed * dt;
        this.x = this.baseX + Math.sin(this.t * 2 + this.phase) * this.amp;
        break;
      case "diver": {
        // drift down then dive toward player's column
        this.y += this.speed * dt * (this.y < h * 0.4 ? 1 : 2.2);
        const dx = playerX - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 1.4 * dt);
        break;
      }
      case "tank":
        this.y += this.speed * dt;
        this.x = this.baseX + Math.sin(this.t * 1.2 + this.phase) * (this.amp * 0.5);
        break;
    }
    this.x = Math.max(this.size / 2, Math.min(w - this.size / 2, this.x));

    if (this.cfg.canShoot && playerY > this.y) {
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        this.fireCd = rand(1.6, 3.2);
        const a = Math.atan2(playerY - this.y, playerX - this.x);
        fire({
          x: this.x,
          y: this.y + this.size / 2,
          vx: Math.cos(a) * 220,
          vy: Math.sin(a) * 220,
          r: 5,
          friendly: false,
          damage: 1,
          color: this.cfg.glow,
          life: 6,
        });
      }
    }

    // Returns true when it has flown off the bottom (counts as a breach).
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
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = this.cfg.glow;
    ctx.shadowBlur = 14;
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
    g.addColorStop(0, this.cfg.color[0]);
    g.addColorStop(1, this.cfg.color[1]);
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : g;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    switch (this.kind) {
      case "grunt": // diamond
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, 0);
        ctx.lineTo(0, s / 2);
        ctx.lineTo(-s / 2, 0);
        ctx.closePath();
        break;
      case "weaver": // hexagon
        for (let i = 0; i < 6; i++) {
          const a = (TAU / 6) * i - Math.PI / 2;
          const px = Math.cos(a) * (s / 2);
          const py = Math.sin(a) * (s / 2);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "diver": // arrow / triangle pointing down
        ctx.moveTo(0, s / 2);
        ctx.lineTo(-s / 2, -s / 2);
        ctx.lineTo(s / 2, -s / 2);
        ctx.closePath();
        break;
      case "tank": // rounded square
        ctx.roundRect(-s / 2, -s / 2, s, s, 8);
        break;
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // HP bar for multi-hit enemies.
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
}

export const ENEMY_KINDS = ["grunt", "weaver", "diver", "tank"] as const;
