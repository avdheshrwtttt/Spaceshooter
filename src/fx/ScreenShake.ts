import { clamp, rand } from "../core/utils";

/** Trauma-based screen shake. Add trauma on impacts; it decays smoothly. */
export class ScreenShake {
  private trauma = 0;
  x = 0;
  y = 0;
  angle = 0;

  add(amount: number) {
    this.trauma = clamp(this.trauma + amount, 0, 1);
  }

  update(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const shake = this.trauma * this.trauma; // quadratic feels punchier
    const max = 16;
    this.x = rand(-1, 1) * max * shake;
    this.y = rand(-1, 1) * max * shake;
    this.angle = rand(-1, 1) * 0.03 * shake;
  }

  apply(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.translate(this.x, this.y);
    if (this.angle) {
      ctx.translate(cx, cy);
      ctx.rotate(this.angle);
      ctx.translate(-cx, -cy);
    }
  }
}
