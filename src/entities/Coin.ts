import { TAU, rand } from "../core/utils";

export class Coin {
  x: number;
  y: number;
  readonly r = 11;
  dead = false;

  private spin = rand(0, TAU);
  private vx: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = rand(-25, 25);
  }

  update(dt: number, h: number): boolean {
    this.spin += dt * 5;
    this.y += 130 * dt;
    this.x += this.vx * dt;
    this.vx *= Math.pow(0.92, dt * 60);
    return this.y - this.r > h;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const squash = Math.max(0.22, Math.abs(Math.cos(this.spin)));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(squash, 1);
    ctx.shadowColor = "#ffd24a";
    ctx.shadowBlur = 14;
    const g = ctx.createLinearGradient(0, -this.r, 0, this.r);
    g.addColorStop(0, "#fff3c2");
    g.addColorStop(0.5, "#ffd24a");
    g.addColorStop(1, "#c98a00");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#fff3c2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.58, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}
