import { TAU } from "../core/utils";
import type { PowerKind } from "./types";

const STYLE: Record<PowerKind, { color: string; icon: string; label: string }> = {
  rapid: { color: "#ffd24a", icon: "⚡", label: "RAPID FIRE" },
  spread: { color: "#38e8ff", icon: "✸", label: "SPREAD +1" },
  shield: { color: "#7affc6", icon: "❖", label: "SHIELD" },
};

export class Powerup {
  x: number;
  y: number;
  readonly r = 15;
  kind: PowerKind;
  dead = false;
  private t = 0;

  constructor(x: number, y: number, kind: PowerKind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
  }

  get color() {
    return STYLE[this.kind].color;
  }
  get label() {
    return STYLE[this.kind].label;
  }

  update(dt: number, h: number): boolean {
    this.t += dt;
    this.y += 95 * dt;
    this.x += Math.sin(this.t * 3) * 0.4;
    return this.y - this.r > h;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = STYLE[this.kind];
    const pulse = 0.6 + 0.4 * Math.sin(this.t * 6);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 16 * pulse;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = s.color;
    ctx.font = "700 16px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.icon, 0, 1);
    ctx.restore();
  }
}

export const POWER_KINDS: PowerKind[] = ["rapid", "spread", "shield"];
