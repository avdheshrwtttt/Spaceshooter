import { TAU, hexToRgb } from "../core/utils";
import type { Bullet, BossTheme } from "./types";

/** A rotating ring-shaped boss, reskinned per galaxy via a BossTheme. */
export class Boss {
  x: number;
  y = -120;
  readonly size = 130;
  readonly r = 58;
  hp: number;
  maxHp: number;
  dead = false;
  hitFlash = 0;
  tier: number;

  private theme: BossTheme;
  private pods: number;
  private t = 0;
  private targetY: number;
  private dir = 1;
  private speed: number;
  private fireCd = 1.2;
  private pattern = 0;
  private patternTimer = 0;
  private ringRot = 0;

  constructor(w: number, tier: number, theme: BossTheme) {
    this.x = w / 2;
    this.targetY = 150;
    this.tier = tier;
    this.theme = theme;
    this.pods = theme.pods;
    this.maxHp = theme.hpBase + (tier - 1) * 22;
    this.hp = this.maxHp;
    this.speed = theme.speedBase + (tier - 1) * 6;
  }

  private podPos(i: number): { x: number; y: number; angle: number } {
    const a = (TAU / this.pods) * i + this.ringRot;
    return { x: this.x + Math.cos(a) * this.size * 0.46, y: this.y + Math.sin(a) * this.size * 0.46, angle: a };
  }

  update(dt: number, w: number, fire: (b: Bullet) => void): void {
    this.t += dt;
    this.ringRot += dt * 0.8;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (this.y < this.targetY) {
      this.y += 70 * dt;
    } else {
      this.x += this.dir * this.speed * dt;
      if (this.x < this.size / 2 + 20) this.dir = 1;
      if (this.x > w - this.size / 2 - 20) this.dir = -1;
    }
    if (this.y < this.targetY - 4) return;

    this.patternTimer -= dt;
    if (this.patternTimer <= 0) {
      this.pattern = (this.pattern + 1) % 3;
      this.patternTimer = 3.2;
    }
    const rage = this.hp < this.maxHp * 0.4 ? 0.55 : 1;
    this.fireCd -= dt;
    if (this.fireCd > 0) return;

    switch (this.pattern) {
      case 0: {
        // Radial spray fired live from each rotating ring pod.
        this.fireCd = 0.85 * rage;
        for (let i = 0; i < this.pods; i++) {
          const p = this.podPos(i);
          fire(this.bullet(p.x, p.y, Math.cos(p.angle) * 170, Math.sin(p.angle) * 170));
        }
        break;
      }
      case 1: {
        this.fireCd = 0.45 * rage;
        const muzzleY = this.y + this.size / 2;
        for (let k = -1; k <= 1; k++) {
          const a = Math.PI / 2 + k * 0.28;
          fire(this.bullet(this.x, muzzleY, Math.cos(a) * 250, Math.sin(a) * 250));
        }
        break;
      }
      case 2: {
        this.fireCd = 0.2 * rage;
        const a = Math.PI / 2 + Math.sin(this.t * 3) * 0.75;
        fire(this.bullet(this.x, this.y + this.size / 2, Math.cos(a) * 270, Math.sin(a) * 270));
        break;
      }
    }
  }

  private bullet(x: number, y: number, vx: number, vy: number): Bullet {
    return { x, y, vx, vy, r: 6, friendly: false, damage: 1, color: this.theme.mid, life: 8 };
  }

  hit(dmg: number): boolean {
    this.hp -= dmg;
    this.hitFlash = 0.06;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { mid, light, dark } = this.theme;
    const [lr, lg, lb] = hexToRgb(light);
    ctx.save();
    ctx.translate(this.x, this.y);

    // Outer rotating wheel-and-spokes ring.
    ctx.save();
    ctx.rotate(this.ringRot);
    ctx.shadowColor = mid;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(${lr},${lg},${lb},0.55)`;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < this.pods; i++) {
      const a = (TAU / this.pods) * i;
      const x1 = Math.cos(a) * s * 0.34;
      const y1 = Math.sin(a) * s * 0.34;
      const x2 = Math.cos(a) * s * 0.5;
      const y2 = Math.sin(a) * s * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.save();
      ctx.translate(x2, y2);
      ctx.shadowBlur = 12;
      ctx.fillStyle = this.hitFlash > 0 ? "#fff" : light;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.07, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Inner pulsing core / eye.
    ctx.shadowBlur = 26;
    ctx.shadowColor = mid;
    const coreR = s * 0.24;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
    g.addColorStop(0, light);
    g.addColorStop(0.5, this.hitFlash > 0 ? "#fff" : mid);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1a0500";
    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.3));
    ctx.beginPath();
    ctx.ellipse(0, 0, coreR * 0.4, coreR * 0.4 * blink, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  drawHealthBar(ctx: CanvasRenderingContext2D, w: number) {
    const { mid, light, name } = this.theme;
    const bw = Math.min(w * 0.7, 520);
    const bx = (w - bw) / 2;
    const by = 22;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(bx - 2, by - 2, bw + 4, 14);
    const pct = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, mid);
    grad.addColorStop(1, light);
    ctx.fillStyle = grad;
    ctx.shadowColor = mid;
    ctx.shadowBlur = 10;
    ctx.fillRect(bx, by, bw * pct, 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = light;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, 10);
    ctx.fillStyle = light;
    ctx.font = "700 12px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`⚠ ${name}${this.tier > 1 ? ` · TIER ${this.tier}` : ""}`, w / 2, by - 4);
    ctx.restore();
  }
}
