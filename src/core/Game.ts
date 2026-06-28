import { Audio } from "./audio";
import { Input } from "./input";
import { clamp, rand, pick, circleRectHit } from "./utils";
import { LEVELS, type LevelConfig } from "./levels";
import { getSelectedAvatar, setSelectedAvatar } from "./avatars";
import { Starfield } from "../fx/Starfield";
import { Particles } from "../fx/Particles";
import { ScreenShake } from "../fx/ScreenShake";
import { FloatingText } from "../fx/FloatingText";
import { HUD } from "../ui/HUD";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { Powerup, POWER_KINDS } from "../entities/Powerup";
import { Coin } from "../entities/Coin";
import type { Bullet, EnemyKind, PowerKind } from "../entities/types";

type State = "menu" | "playing" | "paused" | "gameover";

const BEST_KEY = "nebula-strike-best";
const CREDITS_KEY = "nebula-strike-credits";
const SHIELD_KEY = "nebula-strike-shield-level";
const SHIELD_PRICES = [50, 120, 250];

export class Game {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;

  private audio = new Audio();
  private input: Input;
  private starfield: Starfield;
  private particles = new Particles();
  private shake = new ScreenShake();
  private floats = new FloatingText();
  private hud = new HUD();
  private player: Player;

  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private powerups: Powerup[] = [];
  private coinEntities: Coin[] = [];
  private boss: Boss | null = null;

  private state: State = "menu";
  private time = 0;
  private last = 0;

  private score = 0;
  private best = 0;
  private combo = 0;
  private comboTimer = 0;
  private comboFlash = 0;

  private levelIndex = 0;
  private levelTimer = 0;
  private bossTier = 0;
  private bossRespawnTimer = 0;
  private spawnTimer = 0;

  private coinsRun = 0;
  private credits = 0;

  private bannerTimer = 0;
  private bannerText = "";
  private bannerSub = "";

  // DOM
  private elMenu = document.getElementById("menu")!;
  private elPause = document.getElementById("pause")!;
  private elGameOver = document.getElementById("gameover")!;
  private elAvatarSelect = document.getElementById("avatar-select")!;
  private elShop = document.getElementById("shop")!;
  private elTouchFire = document.getElementById("touch-fire") as HTMLButtonElement;

  constructor(private canvas: HTMLCanvasElement, shipImg: HTMLImageElement) {
    this.ctx = canvas.getContext("2d")!;
    this.player = new Player(shipImg, getSelectedAvatar());
    this.input = new Input(canvas);
    this.starfield = new Starfield(1, 1);

    this.best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
    this.credits = Number(localStorage.getItem(CREDITS_KEY) ?? 0) || 0;
    this.updateBestLabels();
    this.refreshPilotUI();
    this.updateCreditsLabels();

    this.input.onAnyKey = () => {
      this.audio.resume();
      this.audio.startBGM();
    };
    this.input.onPause = () => this.togglePause();

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.wireButtons();
    this.wireParallax();
    this.detectTouch();

    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  // ── Setup helpers ──────────────────────────────────────────────────────────
  private wireButtons() {
    const on = (id: string, fn: () => void) =>
      document.getElementById(id)!.addEventListener("click", () => {
        this.audio.resume();
        this.audio.startBGM();
        fn();
      });
    on("play-btn", () => this.start());
    on("retry-btn", () => this.start());
    on("resume-btn", () => this.togglePause());
    on("menu-btn", () => this.toMenu());
    on("quit-btn", () => this.toMenu());
    on("pilot-btn", () => this.openAvatarSelect());
    on("avatar-back-btn", () => this.closeAvatarSelect());
    on("shop-btn", () => this.openShop());
    on("shop-back-btn", () => this.closeShop());
    on("shop-buy-btn", () => this.buyShield());

    document.querySelectorAll<HTMLElement>(".avatar-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.audio.resume();
        this.audio.startBGM();
        const id = card.dataset.avatar!;
        setSelectedAvatar(id);
        this.player.setAvatar(getSelectedAvatar());
        this.refreshPilotUI();
        this.closeAvatarSelect();
      });
    });

    // Touch fire button.
    const press = (down: boolean) => (e: Event) => {
      e.preventDefault();
      this.input.setTouchFire(down);
    };
    this.elTouchFire.addEventListener("pointerdown", press(true));
    this.elTouchFire.addEventListener("pointerup", press(false));
    this.elTouchFire.addEventListener("pointerleave", press(false));
  }

  private wireParallax() {
    window.addEventListener("mousemove", (e) => {
      if (this.state === "playing") return;
      const rx = clamp((e.clientY / window.innerHeight - 0.5) * -8, -5, 5);
      const ry = clamp((e.clientX / window.innerWidth - 0.5) * 8, -5, 5);
      document.querySelectorAll<HTMLElement>(".menu-inner").forEach((el) => {
        el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    });
  }

  private detectTouch() {
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      document.body.classList.add("touch");
    }
  }

  private updateBestLabels() {
    const set = (id: string, v: number) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    set("menu-best", this.best);
    set("go-best", this.best);
  }

  private updateCreditsLabels() {
    const set = (id: string, v: number) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    set("menu-credits", this.credits);
    set("shop-credits", this.credits);
  }

  private refreshPilotUI() {
    const a = getSelectedAvatar();
    const portrait = document.getElementById("pilot-portrait");
    if (portrait) portrait.className = `avatar-portrait ${a.id}`;
    const name = document.getElementById("pilot-name");
    if (name) name.textContent = a.name;
    document.querySelectorAll<HTMLElement>(".avatar-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.avatar === a.id);
    });
  }

  private getOwnedShieldLevel(): number {
    return clamp(Math.round(Number(localStorage.getItem(SHIELD_KEY) ?? 0) || 0), 0, SHIELD_PRICES.length);
  }

  private refreshShopUI() {
    const lvl = this.getOwnedShieldLevel();
    const pipsEl = document.getElementById("shop-pips");
    if (pipsEl) {
      pipsEl.innerHTML = SHIELD_PRICES.map((_, i) => `<span class="shop-pip${i < lvl ? " filled" : ""}"></span>`).join("");
    }
    const buyBtn = document.getElementById("shop-buy-btn") as HTMLButtonElement | null;
    if (buyBtn) {
      if (lvl >= SHIELD_PRICES.length) {
        buyBtn.textContent = "MAXED";
        buyBtn.disabled = true;
      } else {
        const price = SHIELD_PRICES[lvl];
        buyBtn.textContent = `BUY · ${price} ◎`;
        buyBtn.disabled = this.credits < price;
      }
    }
    this.updateCreditsLabels();
  }

  private buyShield() {
    const lvl = this.getOwnedShieldLevel();
    if (lvl >= SHIELD_PRICES.length) return;
    const price = SHIELD_PRICES[lvl];
    if (this.credits < price) return;
    this.credits -= price;
    localStorage.setItem(CREDITS_KEY, String(this.credits));
    localStorage.setItem(SHIELD_KEY, String(lvl + 1));
    this.audio.powerup();
    this.refreshShopUI();
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.starfield.resize(this.w, this.h);
    if (this.state === "menu") this.player.reset(this.w, this.h);
  }

  // ── State transitions ───────────────────────────────────────────────────────
  private show(el: HTMLElement, visible: boolean) {
    el.classList.toggle("hidden", !visible);
  }

  private openAvatarSelect() {
    this.refreshPilotUI();
    this.show(this.elMenu, false);
    this.show(this.elAvatarSelect, true);
  }

  private closeAvatarSelect() {
    this.show(this.elAvatarSelect, false);
    this.show(this.elMenu, true);
  }

  private openShop() {
    this.refreshShopUI();
    this.show(this.elMenu, false);
    this.show(this.elShop, true);
  }

  private closeShop() {
    this.show(this.elShop, false);
    this.show(this.elMenu, true);
  }

  private start() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.levelIndex = 0;
    this.levelTimer = 0;
    this.bossTier = 0;
    this.bossRespawnTimer = 0;
    this.coinsRun = 0;
    this.spawnTimer = 0;
    this.bullets.length = 0;
    this.enemies.length = 0;
    this.powerups.length = 0;
    this.coinEntities.length = 0;
    this.boss = null;
    this.particles.clear();
    this.floats.clear();
    this.input.clear();
    this.player.reset(this.w, this.h);
    this.player.shield = this.getOwnedShieldLevel();
    this.state = "playing";
    this.show(this.elMenu, false);
    this.show(this.elGameOver, false);
    this.show(this.elPause, false);
    this.show(this.elTouchFire, document.body.classList.contains("touch"));
    this.applyLevel();
  }

  private toMenu() {
    this.state = "menu";
    this.show(this.elMenu, true);
    this.show(this.elPause, false);
    this.show(this.elGameOver, false);
    this.show(this.elAvatarSelect, false);
    this.show(this.elShop, false);
    this.show(this.elTouchFire, false);
    this.updateBestLabels();
    this.updateCreditsLabels();
  }

  private togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.show(this.elPause, true);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.show(this.elPause, false);
      this.last = performance.now();
    }
  }

  private gameOver() {
    this.state = "gameover";
    this.particles.burst(this.player.x, this.player.y, { count: 40, big: true, speed: 5, colors: ["#38e8ff", "#9af6ff", "#ffffff", "#ff3fa4"] });
    this.shake.add(0.9);
    this.audio.explosion(true);
    const isBest = this.score > this.best;
    if (isBest) {
      this.best = this.score;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
    this.credits += this.coinsRun;
    localStorage.setItem(CREDITS_KEY, String(this.credits));
    document.getElementById("go-score")!.textContent = String(this.score);
    document.getElementById("go-level")!.textContent = String(LEVELS[this.levelIndex].index);
    const goCoins = document.getElementById("go-coins");
    if (goCoins) goCoins.textContent = `+${this.coinsRun} ◎ Banked`;
    this.updateBestLabels();
    this.updateCreditsLabels();
    this.show(document.getElementById("new-best")!, isBest);
    this.show(this.elTouchFire, false);
    setTimeout(() => this.show(this.elGameOver, true), 700);
  }

  // ── Levels ───────────────────────────────────────────────────────────────────
  private applyLevel() {
    const lvl = LEVELS[this.levelIndex];
    this.levelTimer = 0;
    this.spawnTimer = 0;
    this.comboFlash = 0;
    this.starfield.setTint(lvl.tint);
    if (lvl.isBoss) {
      this.bossTier++;
      this.boss = new Boss(this.w, this.bossTier);
      this.bossRespawnTimer = 0;
    }
    this.bannerText = `LEVEL ${lvl.index}`;
    this.bannerSub = lvl.galaxy.toUpperCase();
    this.bannerTimer = 2.4;
  }

  private spawnEnemy(lvl: LevelConfig) {
    const size = 44;
    const x = rand(size, this.w - size);
    this.enemies.push(new Enemy(x, -size, pick(lvl.kinds), lvl.speedMul, lvl.hpMul));
  }

  // ── Core loop ──────────────────────────────────────────────────────────────
  private loop = (now: number) => {
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = clamp(dt, 0, 1 / 20); // avoid huge jumps after tab-out
    this.time = now / 1000;

    if (this.state === "playing") this.update(dt);
    else this.starfield.update(dt, this.state === "menu" ? 0.6 : 1);

    this.render(dt);
    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const { w, h } = this;
    this.starfield.update(dt, 1.2);
    this.shake.update(dt);
    this.particles.update(dt);
    this.floats.update(dt);

    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    // Combo decay.
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.comboFlash > 0) this.comboFlash -= dt * 2;

    // Player.
    this.player.update(dt, this.input.axis, this.input.pointerX, w);
    this.player.thrust > 0 && this.particles.thruster(this.player.x, this.player.y + this.player.h / 2, this.player.thrust);
    if (this.input.firing) {
      const shots = this.player.tryFire();
      if (shots) {
        for (const s of shots) {
          this.bullets.push({
            x: s.x, y: s.y,
            vx: Math.cos(s.angle) * 760,
            vy: Math.sin(s.angle) * 760,
            r: 4, friendly: true, damage: 1, color: "#ffe066", life: 2,
          });
        }
        this.particles.spark(this.player.x, this.player.y - this.player.h / 2, "#ffe066");
        this.audio.shoot();
      }
    }

    // Time-based level progression: survive the duration, the level advances.
    const lvl = LEVELS[this.levelIndex];
    if (!lvl.isBoss) {
      this.levelTimer += dt;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy(lvl);
        this.spawnTimer = lvl.spawnInterval;
      }
      if (this.levelTimer >= lvl.duration && this.levelIndex < LEVELS.length - 1) {
        this.levelIndex++;
        this.applyLevel();
      }
    } else if (!this.boss) {
      this.bossRespawnTimer -= dt;
      if (this.bossRespawnTimer <= 0) {
        this.bossTier++;
        this.boss = new Boss(w, this.bossTier);
        this.bannerText = "WARNING";
        this.bannerSub = `OVERLORD TIER ${this.bossTier} APPROACHING`;
        this.bannerTimer = 2.2;
      }
    }

    // Update bullets.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -20 || b.y > h + 20 || b.x < -20 || b.x > w + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Update enemies.
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const breached = e.update(dt, w, h, this.player.x, this.player.y, (b) => this.bullets.push(b));
      if (breached) {
        this.enemies.splice(i, 1);
        this.breach();
      }
    }

    // Update boss.
    if (this.boss) {
      this.boss.update(dt, w, (b) => this.bullets.push(b));
    }

    // Update powerups.
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const gone = p.update(dt, h);
      if (gone) this.powerups.splice(i, 1);
    }

    // Update coins.
    for (let i = this.coinEntities.length - 1; i >= 0; i--) {
      const c = this.coinEntities[i];
      const gone = c.update(dt, h);
      if (gone) this.coinEntities.splice(i, 1);
    }

    this.collide();
  }

  private collide() {
    const { player } = this;

    // Friendly bullets vs enemies / boss.
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.friendly) continue;
      let consumed = false;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (circleRectHit(b.x, b.y, b.r, e.x, e.y, e.size, e.size)) {
          consumed = true;
          if (e.hit(b.damage)) {
            this.onEnemyKilled(e.x, e.y, e.score, e.kind);
            this.enemies.splice(ei, 1);
          } else {
            this.particles.spark(b.x, b.y, e.color ?? "#ff6");
            this.audio.hit();
          }
          break;
        }
      }
      if (!consumed && this.boss && circleRectHit(b.x, b.y, b.r, this.boss.x, this.boss.y, this.boss.size, this.boss.size)) {
        consumed = true;
        this.particles.spark(b.x, b.y, "#ff8a3d");
        if (this.boss.hit(b.damage)) {
          this.onBossKilled();
        } else {
          this.score += 2;
          this.audio.hit();
        }
      }
      if (consumed) this.bullets.splice(bi, 1);
    }

    if (player.invuln > 0 && this.state !== "playing") return;

    // Enemy bullets vs player.
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (b.friendly) continue;
      if (circleRectHit(b.x, b.y, b.r, player.x, player.y, player.w * 0.7, player.h * 0.7)) {
        this.bullets.splice(bi, 1);
        this.hurtPlayer(1);
      }
    }

    // Enemy bodies vs player.
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy < (e.size / 2 + player.r) ** 2) {
        this.particles.burst(e.x, e.y, { count: 12, speed: 3 });
        e.hit(99);
        this.enemies.splice(ei, 1);
        this.hurtPlayer(1);
      }
    }

    // Boss body vs player.
    if (this.boss) {
      const dx = this.boss.x - player.x;
      const dy = this.boss.y - player.y;
      if (dx * dx + dy * dy < (this.boss.r + player.r) ** 2) this.hurtPlayer(1);
    }

    // Powerups vs player.
    for (let pi = this.powerups.length - 1; pi >= 0; pi--) {
      const p = this.powerups[pi];
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      if (dx * dx + dy * dy < (p.r + player.r) ** 2) {
        this.applyPower(p.kind);
        this.floats.spawn(p.x, p.y - 10, p.label, p.color, 16);
        this.particles.burst(p.x, p.y, { count: 14, speed: 2.5, colors: [p.color, "#ffffff"] });
        this.audio.powerup();
        this.powerups.splice(pi, 1);
      }
    }

    // Coins vs player.
    for (let ci = this.coinEntities.length - 1; ci >= 0; ci--) {
      const c = this.coinEntities[ci];
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      if (dx * dx + dy * dy < (c.r + player.r) ** 2) {
        this.coinsRun++;
        this.particles.spark(c.x, c.y, "#ffd24a");
        this.audio.coin();
        this.coinEntities.splice(ci, 1);
      }
    }
  }

  private onEnemyKilled(x: number, y: number, base: number, kind: EnemyKind) {
    this.combo++;
    this.comboTimer = 2.2;
    this.comboFlash = 0.5;
    const mult = 1 + (this.combo - 1) * 0.25;
    const gained = Math.round(base * mult);
    this.score += gained;
    this.floats.spawn(x, y, `+${gained}`, this.combo >= 3 ? "#ff3fa4" : "#ffe066", this.combo >= 3 ? 22 : 18);
    this.particles.burst(x, y, { count: kind === "reaper" ? 26 : 16, big: kind === "reaper" });
    this.shake.add(kind === "reaper" ? 0.28 : 0.16);
    this.audio.explosion(kind === "reaper");
    if (Math.random() < 0.07 || (kind === "reaper" && Math.random() < 0.4)) {
      this.dropPowerup(x, y);
    }
    if (Math.random() < 0.4) {
      this.coinEntities.push(new Coin(x, y));
    }
  }

  private onBossKilled() {
    if (!this.boss) return;
    const x = this.boss.x;
    const y = this.boss.y;
    const tier = this.boss.tier;
    const reward = 200 + tier * 60;
    this.score += reward;
    this.floats.spawn(x, y, `+${reward}`, "#ff8a3d", 30);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.particles.burst(x + rand(-40, 40), y + rand(-30, 30), { count: 30, big: true, speed: 5, colors: ["#ff8a3d", "#ffcf9e", "#ffe066", "#ffffff"] });
        this.shake.add(0.5);
        this.audio.explosion(true);
      }, i * 110);
    }
    this.dropPowerup(x - 24, y);
    this.dropPowerup(x + 24, y);
    for (let i = 0; i < 6; i++) {
      this.coinEntities.push(new Coin(x + rand(-50, 50), y + rand(-30, 30)));
    }
    this.boss = null;
    this.bossRespawnTimer = 3;
  }

  private dropPowerup(x: number, y: number) {
    const kind: PowerKind = pick(POWER_KINDS);
    this.powerups.push(new Powerup(x, y, kind));
  }

  private applyPower(kind: PowerKind) {
    switch (kind) {
      case "rapid":
        this.player.rapidUntil = performance.now() + 6000;
        break;
      case "spread":
        this.player.weaponLevel = Math.min(2, this.player.weaponLevel + 1);
        break;
      case "shield":
        this.player.shield = Math.min(3, this.player.shield + 1);
        break;
    }
  }

  private hurtPlayer(dmg: number) {
    const hit = this.player.damageBy(dmg);
    if (hit) {
      this.combo = 0;
      this.shake.add(0.5);
      this.audio.hit();
      this.particles.burst(this.player.x, this.player.y, { count: 16, speed: 4, colors: ["#38e8ff", "#ffffff", "#ff4d5e"] });
      if (this.player.health <= 0) this.gameOver();
    } else {
      this.shake.add(0.2);
      this.particles.spark(this.player.x, this.player.y - 10, "#7affc6");
    }
  }

  private breach() {
    // An enemy reached the bottom — costs a hull point, breaks combo.
    this.combo = 0;
    this.hurtPlayer(1);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  private render(_dt: number) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    ctx.save();
    this.shake.apply(ctx, this.w / 2, this.h / 2);

    this.starfield.draw(ctx);

    if (this.state !== "menu") {
      for (const p of this.powerups) p.draw(ctx);
      for (const c of this.coinEntities) c.draw(ctx);
      for (const e of this.enemies) e.draw(ctx);
      if (this.boss) this.boss.draw(ctx);
      this.drawBullets(ctx);
      this.particles.draw(ctx);
      if (this.state !== "gameover") this.player.draw(ctx, this.time);
      this.floats.draw(ctx);
    } else {
      this.particles.draw(ctx);
    }

    ctx.restore();

    // HUD + banners are not shaken.
    if (this.state === "playing" || this.state === "paused") {
      const lvl = LEVELS[this.levelIndex];
      this.hud.draw(ctx, this.w, this.player, {
        score: this.score, best: this.best, level: lvl.index, galaxy: lvl.galaxy,
        combo: this.combo, comboFlash: this.comboFlash, coins: this.coinsRun,
      }, this.time);
      if (this.boss) this.boss.drawHealthBar(ctx, this.w);
      if (this.bannerTimer > 0) {
        const a = Math.min(1, this.bannerTimer) * Math.min(1, (2 - this.bannerTimer) * 4 + 0.2);
        this.hud.banner(ctx, this.w, this.h, this.bannerText, this.bannerSub, clamp(a, 0, 1));
      }
    }
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const b of this.bullets) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.color;
      if (b.friendly) {
        // streak
        ctx.beginPath();
        ctx.roundRect(b.x - b.r / 2, b.y - 7, b.r, 14, b.r / 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
