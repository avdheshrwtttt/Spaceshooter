interface FText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  vy: number;
}

/** Rising score / combo popups. */
export class FloatingText {
  private items: FText[] = [];

  spawn(x: number, y: number, text: string, color = "#ffe066", size = 18) {
    this.items.push({ x, y, text, color, life: 0.9, maxLife: 0.9, size, vy: -40 });
  }

  update(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.vy * dt;
      it.vy *= Math.pow(0.9, dt * 60);
      it.life -= dt;
      if (it.life <= 0) this.items.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const it of this.items) {
      const t = it.life / it.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.6);
      ctx.font = `700 ${it.size}px Orbitron, sans-serif`;
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 10;
      ctx.fillText(it.text, it.x, it.y);
    }
    ctx.restore();
  }

  clear() {
    this.items.length = 0;
  }
}
