import { clamp, damp, hexToRgb, TAU } from "../core/utils";
import type { Avatar } from "../core/avatars";

export class Player {
  x = 0;
  y = 0;
  readonly w = 44;
  readonly h = 52;
  readonly r = 18; // collision radius
  speed = 560; // px/s

  tilt = 0; // visual banking, -1..1
  thrust = 0; // engine flame strength 0..1

  maxHealth = 5;
  health = 5;
  shield = 0; // permanent hits absorbed (bought in shop / rare drops)
  aegisUntil = 0; // timed full-damage-block buff, separate from `shield`
  invuln = 0; // seconds of i-frames

  private fireCd = 0;
  weaponLevel = 0; // 0 single, grows with spread powerup — temporary, see weaponUntil
  weaponUntil = 0;
  rapidUntil = 0;

  constructor(private img: HTMLImageElement, public avatar: Avatar) {}

  setAvatar(avatar: Avatar) {
    this.avatar = avatar;
  }

  reset(w: number, h: number) {
    this.x = w / 2;
    this.y = h - 90;
    this.health = this.maxHealth;
    this.shield = 0;
    this.aegisUntil = 0;
    this.invuln = 0;
    this.tilt = 0;
    this.weaponLevel = 0;
    this.weaponUntil = 0;
    this.rapidUntil = 0;
    this.fireCd = 0;
  }

  get rapid() {
    return performance.now() < this.rapidUntil;
  }

  get aegisActive() {
    return performance.now() < this.aegisUntil;
  }

  /** Refreshes the temporary multi-shot/longer-bullet buff. */
  boostWeapon() {
    this.weaponLevel = Math.min(2, this.weaponLevel + 1);
    this.weaponUntil = performance.now() + 10000;
  }

  /** Grants a timed full-damage-block buff (stacks duration, not charges). */
  grantAegis(seconds = 8) {
    this.aegisUntil = performance.now() + seconds * 1000;
  }

  update(dt: number, axisX: number, axisY: number, w: number, h: number) {
    this.x += axisX * this.speed * dt;
    this.x = clamp(this.x, this.w / 2, w - this.w / 2);

    this.y += axisY * this.speed * dt;
    this.y = clamp(this.y, h * 0.3, h - this.h / 2 - 6);

    this.tilt = damp(this.tilt, axisX, 10, dt);
    this.thrust = damp(this.thrust, 0.6 + (Math.abs(axisX) + Math.abs(axisY)) * 0.2, 8, dt);

    if (this.fireCd > 0) this.fireCd -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.weaponLevel > 0 && performance.now() > this.weaponUntil) this.weaponLevel = 0;
  }

  /** Returns muzzle spawn points if the weapon is ready, else null. */
  tryFire(): { x: number; y: number; angle: number; len: number }[] | null {
    if (this.fireCd > 0) return null;
    this.fireCd = this.rapid ? 0.11 : 0.2;
    const nose = this.y - this.h / 2;
    const len = this.weaponLevel >= 2 ? 26 : this.weaponLevel >= 1 ? 22 : 14;
    const shots: { x: number; y: number; angle: number; len: number }[] = [
      { x: this.x, y: nose, angle: -Math.PI / 2, len },
    ];
    if (this.weaponLevel >= 1) {
      shots.push({ x: this.x - 12, y: nose + 8, angle: -Math.PI / 2 - 0.18, len });
      shots.push({ x: this.x + 12, y: nose + 8, angle: -Math.PI / 2 + 0.18, len });
    }
    if (this.weaponLevel >= 2) {
      shots.push({ x: this.x - 20, y: nose + 14, angle: -Math.PI / 2 - 0.36, len });
      shots.push({ x: this.x + 20, y: nose + 14, angle: -Math.PI / 2 + 0.36, len });
    }
    return shots;
  }

  /** Apply damage. Returns true if the ship was actually hit. */
  damageBy(amount: number): boolean {
    if (this.invuln > 0) return false;
    if (this.aegisActive) {
      this.invuln = 0.6;
      return false; // aegis buff ate it, no charge consumed
    }
    if (this.shield > 0) {
      this.shield -= 1;
      this.invuln = 0.6;
      return false; // shield charge ate it
    }
    this.health = Math.max(0, this.health - amount);
    this.invuln = 1.0;
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const blink = this.invuln > 0 && Math.floor(time * 20) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt * 0.35);
    ctx.globalAlpha = blink ? 0.35 : 1;

    // Engine flame, tinted to the selected pilot's colors.
    const [pr, pg, pb] = hexToRgb(this.avatar.primary);
    const [sr, sg, sb] = hexToRgb(this.avatar.secondary);
    const flame = this.h / 2 + 6 + Math.sin(time * 40) * 4 + this.thrust * 10;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fg = ctx.createLinearGradient(0, this.h / 2, 0, this.h / 2 + flame);
    fg.addColorStop(0, `rgba(${sr},${sg},${sb},0.95)`);
    fg.addColorStop(0.5, `rgba(${pr},${pg},${pb},0.6)`);
    fg.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-7, this.h / 2 - 2);
    ctx.lineTo(0, this.h / 2 + flame);
    ctx.lineTo(7, this.h / 2 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Permanent shield-charge bubble.
    if (this.shield > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${pr},${pg},${pb},${0.5 + 0.3 * Math.sin(time * 8)})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.avatar.primary;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 12, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // Temporary aegis buff — a brighter, faster-pulsing lime bubble layered outside it.
    if (this.aegisActive) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(202,255,112,${0.55 + 0.35 * Math.sin(time * 14)})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#caff70";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 20, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // Ship sprite (with glow) or vector fallback, hue-shifted to the selected pilot.
    ctx.shadowColor = this.avatar.primary;
    ctx.shadowBlur = 16;
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.filter = this.avatar.hue ? `hue-rotate(${this.avatar.hue}deg) saturate(1.3)` : "none";
      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
      ctx.filter = "none";
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      g.addColorStop(0, this.avatar.secondary);
      g.addColorStop(1, this.avatar.primary);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = this.avatar.secondary;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}
