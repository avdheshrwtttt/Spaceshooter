import { TAU, hexToRgb } from "../core/utils";
import type { Bullet, BossTheme } from "./types";

/** A galaxy-themed boss. Same movement/attack engine for all; `theme.kind` picks a bespoke villain design. */
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

  /** Evenly-spaced firing points around the boss — purely a gameplay geometry helper, independent of the visual design. */
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
        // Radial spray fired live from points orbiting the boss.
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
    ctx.save();
    switch (this.theme.kind) {
      case "wraith":
        this.drawWraith(ctx);
        break;
      case "specter":
        this.drawSpecter(ctx);
        break;
      case "golem":
        this.drawGolem(ctx);
        break;
      case "leviathan":
        this.drawLeviathan(ctx);
        break;
      case "overlord":
        this.drawOverlord(ctx);
        break;
    }
    ctx.restore();
  }

  /** Milky Way Sentinel — a shadow wraith with reaching claws and a glowing ember core. */
  private drawWraith(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { mid, light, dark } = this.theme;
    const sway = Math.sin(this.t * 1.4);
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = "rgba(20,10,30,0.6)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    for (let i = -2; i <= 2; i++) {
      const tx = i * s * 0.12;
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.3);
      ctx.quadraticCurveTo(tx + Math.sin(this.t * 2 + i) * 10, s * 0.55, tx * 1.4, s * 0.5 + Math.abs(i) * 10);
      ctx.stroke();
    }

    const drawClaw = (side: number) => {
      ctx.save();
      ctx.translate(side * s * 0.3, -s * 0.05);
      ctx.rotate(side * (0.5 + sway * 0.05));
      ctx.fillStyle = this.hitFlash > 0 ? "#fff" : dark;
      ctx.strokeStyle = mid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * s * 0.1, -s * 0.35, side * s * 0.05, -s * 0.55);
      ctx.lineTo(side * s * 0.18, -s * 0.5);
      ctx.quadraticCurveTo(side * s * 0.12, -s * 0.3, side * s * 0.22, -s * 0.32);
      ctx.lineTo(side * s * 0.3, -s * 0.5);
      ctx.quadraticCurveTo(side * s * 0.18, -s * 0.22, side * s * 0.28, -s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    drawClaw(-1);
    drawClaw(1);

    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : "#0c0712";
    ctx.shadowColor = mid;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.quadraticCurveTo(s * 0.32, -s * 0.3, s * 0.26, s * 0.05);
    ctx.quadraticCurveTo(s * 0.2, s * 0.32, 0, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.32, -s * 0.26, s * 0.05);
    ctx.quadraticCurveTo(-s * 0.32, -s * 0.3, 0, -s * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 26;
    const coreR = s * 0.16;
    const cg = ctx.createRadialGradient(0, s * 0.06, 0, 0, s * 0.06, coreR);
    cg.addColorStop(0, light);
    cg.addColorStop(0.5, this.hitFlash > 0 ? "#fff" : mid);
    cg.addColorStop(1, dark);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, s * 0.06, coreR, 0, TAU);
    ctx.fill();

    ctx.shadowBlur = 14;
    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.2, s * 0.045, s * 0.06, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.1, -s * 0.2, s * 0.045, s * 0.06, 0, 0, TAU);
    ctx.fill();
  }

  /** Andromeda Devourer — a hooded specter with hypnotic swirl eyes. */
  private drawSpecter(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { light, dark } = this.theme;
    const [lr, lg, lb] = hexToRgb(light);
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : "#0a0a14";
    ctx.shadowColor = light;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.46);
    ctx.quadraticCurveTo(s * 0.34, -s * 0.36, s * 0.3, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.22, s * 0.3, 0, s * 0.46);
    ctx.quadraticCurveTo(-s * 0.22, s * 0.3, -s * 0.3, -s * 0.05);
    ctx.quadraticCurveTo(-s * 0.34, -s * 0.36, 0, -s * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${lr},${lg},${lb},0.5)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.strokeStyle = dark;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = -2; i <= 2; i++) {
      const tx = i * s * 0.1;
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.4);
      ctx.quadraticCurveTo(tx + Math.sin(this.t * 3 + i) * 8, s * 0.5, tx + Math.sin(this.t * 3 + i + 1) * 6, s * 0.6);
      ctx.stroke();
    }

    const drawEye = (ex: number) => {
      ctx.save();
      ctx.translate(ex, -s * 0.1);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff" : light;
      ctx.shadowColor = light;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.09, s * 0.11, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      const spin = this.ringRot * 2;
      ctx.moveTo(0, 0);
      for (let a = 0; a < TAU * 2; a += 0.3) {
        const r = (a / (TAU * 2)) * s * 0.09;
        ctx.lineTo(Math.cos(a + spin) * r, Math.sin(a + spin) * r);
      }
      ctx.stroke();
      ctx.restore();
    };
    drawEye(-s * 0.1);
    drawEye(s * 0.1);
  }

  /** Spiral Marauder — a cracked rock golem with glowing fault-line veins. */
  private drawGolem(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { mid, light, dark } = this.theme;
    const jitter = Math.sin(this.t * 20) * 1.2;
    ctx.translate(this.x + jitter, this.y);

    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : "#241c18";
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.46);
    ctx.lineTo(s * 0.14, -s * 0.42);
    ctx.lineTo(s * 0.3, -s * 0.2);
    ctx.lineTo(s * 0.36, s * 0.05);
    ctx.lineTo(s * 0.22, s * 0.3);
    ctx.lineTo(s * 0.06, s * 0.44);
    ctx.lineTo(-s * 0.12, s * 0.38);
    ctx.lineTo(-s * 0.3, s * 0.18);
    ctx.lineTo(-s * 0.34, -s * 0.1);
    ctx.lineTo(-s * 0.24, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1a1410";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.26, -s * 0.18);
      ctx.lineTo(side * s * 0.42, -s * 0.3);
      ctx.lineTo(side * s * 0.3, -s * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    const flicker = 0.6 + 0.4 * Math.sin(this.t * 6);
    ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.shadowColor = mid;
    ctx.shadowBlur = 10 * flicker;
    ctx.lineWidth = 2;
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.3);
    ctx.lineTo(0, -s * 0.05);
    ctx.lineTo(-s * 0.08, s * 0.15);
    ctx.lineTo(s * 0.04, s * 0.3);
    ctx.moveTo(s * 0.1, -s * 0.25);
    ctx.lineTo(s * 0.18, 0);
    ctx.lineTo(s * 0.1, s * 0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 16;
    const eyeR = s * 0.1;
    const eg = ctx.createRadialGradient(0, -s * 0.12, 0, 0, -s * 0.12, eyeR);
    eg.addColorStop(0, light);
    eg.addColorStop(0.6, this.hitFlash > 0 ? "#fff" : mid);
    eg.addColorStop(1, dark);
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, eyeR, 0, TAU);
    ctx.fill();
  }

  /** Whirlpool Leviathan — a serpentine sea-monster orbited by curling water tendrils. */
  private drawLeviathan(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { mid, light, dark } = this.theme;
    const [mr, mg, mb] = hexToRgb(mid);
    ctx.translate(this.x, this.y);

    for (let i = 0; i < this.pods; i++) {
      const a = (TAU / this.pods) * i + this.ringRot;
      const ox = Math.cos(a) * s * 0.42;
      const oy = Math.sin(a) * s * 0.42;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a + Math.PI / 2);
      ctx.strokeStyle = `rgba(${mr},${mg},${mb},0.6)`;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.shadowColor = mid;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.quadraticCurveTo(s * 0.08, 0, 0, s * 0.1);
      ctx.stroke();
      ctx.restore();
    }

    ctx.shadowColor = mid;
    ctx.shadowBlur = 14;
    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : dark;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.26, -s * 0.3, s * 0.22, 0);
    ctx.quadraticCurveTo(s * 0.18, s * 0.28, 0, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.18, s * 0.28, -s * 0.22, 0);
    ctx.quadraticCurveTo(-s * 0.26, -s * 0.3, 0, -s * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.lineWidth = 2.5;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.16, -s * 0.05 + i * s * 0.08);
        ctx.lineTo(side * s * 0.24, s * 0.02 + i * s * 0.08);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 18;
    const eyeR = s * 0.09;
    const eg = ctx.createRadialGradient(0, -s * 0.05, 0, 0, -s * 0.05, eyeR);
    eg.addColorStop(0, light);
    eg.addColorStop(0.6, this.hitFlash > 0 ? "#fff" : mid);
    eg.addColorStop(1, dark);
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, eyeR, 0, TAU);
    ctx.fill();
  }

  /** Cartwheel Overlord — a golden-armored alien overlord, crowned by a slow-turning halo ring. */
  private drawOverlord(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    const { mid, light, dark } = this.theme;
    const [mr, mg, mb] = hexToRgb(mid);
    ctx.translate(this.x, this.y);

    ctx.save();
    ctx.rotate(this.ringRot);
    ctx.strokeStyle = `rgba(${mr},${mg},${mb},0.55)`;
    ctx.lineWidth = 3;
    ctx.shadowColor = mid;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < this.pods; i++) {
      const a = (TAU / this.pods) * i;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(s * 0.5, 0);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff" : light;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.05, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.quadraticCurveTo(s * 0.2, s * 0.42 + Math.sin(this.t * 2) * 6, s * 0.05, s * 0.55);
    ctx.stroke();

    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : mid;
    ctx.shadowColor = mid;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.22, -s * 0.08, s * 0.2, s * 0.14);
    ctx.quadraticCurveTo(s * 0.1, s * 0.3, 0, s * 0.32);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.3, -s * 0.2, s * 0.14);
    ctx.quadraticCurveTo(-s * 0.22, -s * 0.08, 0, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * s * 0.2, -s * 0.06, s * 0.09, 0, TAU);
      ctx.fill();
    }

    ctx.shadowBlur = 10;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, s * 0.06, s * 0.06, 0, TAU);
    ctx.fill();

    ctx.fillStyle = this.hitFlash > 0 ? "#fff" : light;
    ctx.shadowColor = light;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.28, s * 0.13, s * 0.15, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = mid;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.38);
    ctx.lineTo(-s * 0.2, -s * 0.56);
    ctx.lineTo(-s * 0.04, -s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.38);
    ctx.lineTo(s * 0.2, -s * 0.56);
    ctx.lineTo(s * 0.04, -s * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 16;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.34, s * 0.045, 0, TAU);
    ctx.fill();
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
