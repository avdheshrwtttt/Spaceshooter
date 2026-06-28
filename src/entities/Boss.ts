import { TAU } from "../core/utils";
import type { Bullet } from "./types";

/** A wave boss: enters from the top, strafes, and cycles attack patterns. */
export class Boss {
  x: number;
  y = -90;
  readonly size = 110;
  readonly r = 52;
  hp: number;
  maxHp: number;
  dead = false;
  hitFlash = 0;

  private t = 0;
  private targetY: number;
  private dir = 1;
  private speed = 90;
  private fireCd = 1.2;
  private pattern = 0;
  private patternTimer = 0;

  constructor(w: number, level: number) {
    this.x = w / 2;
    this.targetY = 130;
    this.maxHp = 40 + level * 14;
    this.hp = this.maxHp;
  }

  update(dt: number, w: number, fire: (b: Bullet) => void): void {
    this.t += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Entrance, then strafe.
    if (this.y < this.targetY) {
      this.y += 70 * dt;
    } else {
      this.x += this.dir * this.speed * dt;
      if (this.x < this.size / 2 + 20) this.dir = 1;
      if (this.x > w - this.size / 2 - 20) this.dir = -1;
    }

    if (this.y < this.targetY - 4) return; // don't fire until in position

    // Cycle attack patterns every few seconds; rage faster at low hp.
    this.patternTimer -= dt;
    if (this.patternTimer <= 0) {
      this.pattern = (this.pattern + 1) % 3;
      this.patternTimer = 3.4;
    }
    const rage = this.hp < this.maxHp * 0.4 ? 0.6 : 1;
    this.fireCd -= dt;
    if (this.fireCd > 0) return;

    const muzzleY = this.y + this.size / 2;
    switch (this.pattern) {
      case 0: {
        // radial spray
        this.fireCd = 0.9 * rage;
        const n = 14;
        const off = this.t;
        for (let i = 0; i < n; i++) {
          const a = (TAU / n) * i + off;
          fire(this.bullet(this.x, this.y, Math.cos(a) * 160, Math.sin(a) * 160));
        }
        break;
      }
      case 1: {
        // aimed triple
        this.fireCd = 0.5 * rage;
        for (let k = -1; k <= 1; k++) {
          const a = Math.PI / 2 + k * 0.3;
          fire(this.bullet(this.x, muzzleY, Math.cos(a) * 240, Math.sin(a) * 240));
        }
        break;
      }
      case 2: {
        // sweeping fan
        this.fireCd = 0.25 * rage;
        const a = Math.PI / 2 + Math.sin(this.t * 3) * 0.7;
        fire(this.bullet(this.x, muzzleY, Math.cos(a) * 260, Math.sin(a) * 260));
        break;
      }
    }
  }

  private bullet(x: number, y: number, vx: number, vy: number): Bullet {
    return { x, y, vx, vy, r: 6, friendly: false, damage: 1, color: "#ff5bd0", life: 8 };
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
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = "#ff5bd0";
    ctx.shadowBlur = 26;
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
    g.addColorStop(0, "#ff9be0");
    g.addColorStop(0.5, "#b023a0");
    g.addColorStop(1, "#3a0040");
    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : g;
    ctx.strokeStyle = "#ffc7f0";
    ctx.lineWidth = 2.5;

    // body — angular cruiser
    ctx.beginPath();
    ctx.moveTo(0, s / 2);
    ctx.lineTo(-s / 2, s * 0.12);
    ctx.lineTo(-s / 2.4, -s / 2);
    ctx.lineTo(0, -s / 3);
    ctx.lineTo(s / 2.4, -s / 2);
    ctx.lineTo(s / 2, s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // core
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(255,235,120,${0.7 + 0.3 * Math.sin(this.t * 6)})`;
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, s * 0.14, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawHealthBar(ctx: CanvasRenderingContext2D, w: number) {
    const bw = Math.min(w * 0.7, 520);
    const bx = (w - bw) / 2;
    const by = 22;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(bx - 2, by - 2, bw + 4, 14);
    const pct = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, "#ff5bd0");
    grad.addColorStop(1, "#ff9be0");
    ctx.fillStyle = grad;
    ctx.shadowColor = "#ff5bd0";
    ctx.shadowBlur = 10;
    ctx.fillRect(bx, by, bw * pct, 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,199,240,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, 10);
    ctx.fillStyle = "#ffc7f0";
    ctx.font = "700 12px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("⚠ DREADNOUGHT", w / 2, by - 4);
    ctx.restore();
  }
}
