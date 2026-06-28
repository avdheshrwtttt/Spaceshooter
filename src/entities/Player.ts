import { clamp, damp, TAU } from "../core/utils";

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
  shield = 0; // hits absorbed
  invuln = 0; // seconds of i-frames

  private fireCd = 0;
  weaponLevel = 0; // 0 single, grows with spread powerup
  rapidUntil = 0;

  constructor(private img: HTMLImageElement) {}

  reset(w: number, h: number) {
    this.x = w / 2;
    this.y = h - 90;
    this.health = this.maxHealth;
    this.shield = 0;
    this.invuln = 0;
    this.tilt = 0;
    this.weaponLevel = 0;
    this.rapidUntil = 0;
    this.fireCd = 0;
  }

  get rapid() {
    return performance.now() < this.rapidUntil;
  }

  update(dt: number, axis: number, pointerX: number | null, w: number) {
    let targetVx = axis;
    if (pointerX !== null) {
      const diff = pointerX - this.x;
      targetVx = clamp(diff / 40, -1, 1);
      this.x += clamp(diff, -this.speed * dt, this.speed * dt);
    } else {
      this.x += axis * this.speed * dt;
    }
    this.x = clamp(this.x, this.w / 2, w - this.w / 2);

    this.tilt = damp(this.tilt, targetVx, 10, dt);
    this.thrust = damp(this.thrust, 0.6 + Math.abs(targetVx) * 0.4, 8, dt);

    if (this.fireCd > 0) this.fireCd -= dt;
    if (this.invuln > 0) this.invuln -= dt;
  }

  /** Returns muzzle spawn points if the weapon is ready, else null. */
  tryFire(): { x: number; y: number; angle: number }[] | null {
    if (this.fireCd > 0) return null;
    this.fireCd = this.rapid ? 0.11 : 0.2;
    const nose = this.y - this.h / 2;
    const shots: { x: number; y: number; angle: number }[] = [{ x: this.x, y: nose, angle: -Math.PI / 2 }];
    if (this.weaponLevel >= 1) {
      shots.push({ x: this.x - 12, y: nose + 8, angle: -Math.PI / 2 - 0.18 });
      shots.push({ x: this.x + 12, y: nose + 8, angle: -Math.PI / 2 + 0.18 });
    }
    if (this.weaponLevel >= 2) {
      shots.push({ x: this.x - 20, y: nose + 14, angle: -Math.PI / 2 - 0.36 });
      shots.push({ x: this.x + 20, y: nose + 14, angle: -Math.PI / 2 + 0.36 });
    }
    return shots;
  }

  /** Apply damage. Returns true if the ship was actually hit. */
  damageBy(amount: number): boolean {
    if (this.invuln > 0) return false;
    if (this.shield > 0) {
      this.shield -= 1;
      this.invuln = 0.6;
      return false; // shield ate it
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

    // Engine flame.
    const flame = this.h / 2 + 6 + Math.sin(time * 40) * 4 + this.thrust * 10;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fg = ctx.createLinearGradient(0, this.h / 2, 0, this.h / 2 + flame);
    fg.addColorStop(0, "rgba(160,245,255,0.95)");
    fg.addColorStop(0.5, "rgba(56,232,255,0.6)");
    fg.addColorStop(1, "rgba(40,80,255,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-7, this.h / 2 - 2);
    ctx.lineTo(0, this.h / 2 + flame);
    ctx.lineTo(7, this.h / 2 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Shield bubble.
    if (this.shield > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(56,232,255,${0.5 + 0.3 * Math.sin(time * 8)})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = "#38e8ff";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 12, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // Ship sprite (with glow) or vector fallback.
    ctx.shadowColor = "#38e8ff";
    ctx.shadowBlur = 16;
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      g.addColorStop(0, "#9af6ff");
      g.addColorStop(1, "#1438cc");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#bff4ff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}
