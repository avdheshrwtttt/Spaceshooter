import type { Player } from "../entities/Player";

export interface HudState {
  score: number;
  best: number;
  wave: number;
  combo: number;
  comboFlash: number;
}

/** On-canvas heads-up display: score, wave, combo, health pips, buff timers. */
export class HUD {
  draw(ctx: CanvasRenderingContext2D, w: number, player: Player, s: HudState, time: number) {
    ctx.save();
    ctx.textBaseline = "top";

    // Score (left).
    ctx.textAlign = "left";
    ctx.font = "700 14px Orbitron, sans-serif";
    ctx.fillStyle = "rgba(223,246,255,0.6)";
    ctx.fillText("SCORE", 22, 18);
    ctx.font = "900 30px Orbitron, sans-serif";
    ctx.fillStyle = "#dff6ff";
    ctx.shadowColor = "#38e8ff";
    ctx.shadowBlur = 12;
    ctx.fillText(String(s.score).padStart(6, "0"), 22, 34);
    ctx.shadowBlur = 0;
    ctx.font = "600 12px Rajdhani, sans-serif";
    ctx.fillStyle = "rgba(255,210,74,0.85)";
    ctx.fillText(`BEST ${String(s.best).padStart(6, "0")}`, 22, 70);

    // Wave (center).
    ctx.textAlign = "center";
    ctx.font = "700 16px Orbitron, sans-serif";
    ctx.fillStyle = "#ffd24a";
    ctx.shadowColor = "#ffd24a";
    ctx.shadowBlur = 10;
    ctx.fillText(`WAVE ${s.wave}`, w / 2, 44);
    ctx.shadowBlur = 0;

    // Combo (center, below wave).
    if (s.combo >= 2) {
      const scale = 1 + Math.min(0.5, s.comboFlash);
      ctx.save();
      ctx.translate(w / 2, 74);
      ctx.scale(scale, scale);
      ctx.font = "900 20px Orbitron, sans-serif";
      ctx.fillStyle = "#ff3fa4";
      ctx.shadowColor = "#ff3fa4";
      ctx.shadowBlur = 12;
      ctx.fillText(`x${s.combo} COMBO`, 0, 0);
      ctx.restore();
    }

    // Health pips + shield (right).
    ctx.textAlign = "right";
    ctx.font = "700 14px Orbitron, sans-serif";
    ctx.fillStyle = "rgba(223,246,255,0.6)";
    ctx.fillText("HULL", w - 22, 18);
    const pip = 16;
    const gap = 6;
    const total = player.maxHealth;
    for (let i = 0; i < total; i++) {
      const px = w - 22 - (i + 1) * (pip + gap) + gap;
      const py = 40;
      const filled = total - 1 - i < player.health;
      ctx.beginPath();
      ctx.roundRect(px, py, pip, pip, 3);
      if (filled) {
        ctx.fillStyle = player.health <= 1 ? "#ff4d5e" : "#38e8ff";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(223,246,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // Buff badges (right, below hull).
    let by = 66;
    if (player.shield > 0) {
      this.badge(ctx, w - 22, by, `❖ SHIELD ${player.shield}`, "#7affc6");
      by += 22;
    }
    if (player.rapid) {
      const remain = ((player.rapidUntil - time * 1000) / 1000).toFixed(1);
      this.badge(ctx, w - 22, by, `⚡ RAPID ${remain}s`, "#ffd24a");
      by += 22;
    }
    if (player.weaponLevel > 0) {
      this.badge(ctx, w - 22, by, `✸ SPREAD ${player.weaponLevel}`, "#38e8ff");
    }

    ctx.restore();
  }

  private badge(ctx: CanvasRenderingContext2D, xRight: number, y: number, text: string, color: string) {
    ctx.save();
    ctx.textAlign = "right";
    ctx.font = "700 13px Orbitron, sans-serif";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(text, xRight, y);
    ctx.restore();
  }

  /** Big centered wave-announcement banner. */
  banner(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, sub: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 clamp(34px, 7vw, 64px) Orbitron, sans-serif";
    ctx.fillStyle = "#dff6ff";
    ctx.shadowColor = "#38e8ff";
    ctx.shadowBlur = 24;
    ctx.fillText(text, w / 2, h / 2 - 10);
    ctx.font = "700 20px Orbitron, sans-serif";
    ctx.fillStyle = "#ffd24a";
    ctx.shadowColor = "#ffd24a";
    ctx.fillText(sub, w / 2, h / 2 + 34);
    ctx.restore();
  }
}
