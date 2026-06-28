// Fully procedural audio — no asset files. Synth SFX + a looping chiptune BGM.

export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bgmStarted = false;
  private bgmTimer: number | null = null;
  muted = false;

  /** Must be called from a user gesture (browser autoplay policy). */
  resume(): void {
    let ctx = this.ctx;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  }

  private get now(): number {
    return this.ctx!.currentTime;
  }

  shoot(): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(900, this.now);
    o.frequency.exponentialRampToValueAtTime(240, this.now + 0.11);
    g.gain.setValueAtTime(0.12, this.now);
    g.gain.exponentialRampToValueAtTime(0.001, this.now + 0.11);
    o.connect(g);
    g.connect(this.master);
    o.start(this.now);
    o.stop(this.now + 0.12);
  }

  explosion(big = false): void {
    if (!this.ctx) return;
    const dur = big ? 0.6 : 0.26;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = big ? 900 : 460;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(big ? 0.5 : 0.32, this.now);
    g.gain.exponentialRampToValueAtTime(0.001, this.now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(this.now);
    src.stop(this.now + dur);
  }

  hit(): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, this.now);
    o.frequency.exponentialRampToValueAtTime(60, this.now + 0.25);
    g.gain.setValueAtTime(0.3, this.now);
    g.gain.exponentialRampToValueAtTime(0.001, this.now + 0.25);
    o.connect(g);
    g.connect(this.master);
    o.start(this.now);
    o.stop(this.now + 0.26);
  }

  powerup(): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(440, this.now);
    o.frequency.setValueAtTime(660, this.now + 0.08);
    o.frequency.setValueAtTime(880, this.now + 0.16);
    g.gain.setValueAtTime(0.25, this.now);
    g.gain.exponentialRampToValueAtTime(0.001, this.now + 0.35);
    o.connect(g);
    g.connect(this.master);
    o.start(this.now);
    o.stop(this.now + 0.36);
  }

  // ── Looping background music ───────────────────────────────────────────────
  startBGM(): void {
    if (!this.ctx || this.bgmStarted) return;
    this.bgmStarted = true;
    const ctx = this.ctx;

    const bpm = 140;
    const step = 60 / bpm / 4;
    const bus = ctx.createGain();
    bus.gain.value = 0.18;
    bus.connect(this.master);

    const reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 1.4;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    reverb.buffer = ir;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.16;
    reverb.connect(reverbGain);
    reverbGain.connect(bus);

    const base = 110;
    const pent = [0, 3, 5, 7, 10];
    const freq = (semi: number) => base * Math.pow(2, semi / 12);
    const scale: number[] = [];
    for (let oct = 0; oct < 3; oct++) for (const s of pent) scale.push(freq(s + oct * 12));

    const melody = [
      10, 12, 14, 12, 10, 9, 10, 9, 12, 14, 16, 14, 12, 10, 9, 7, 10, 12, 14, 16, 14, 12, 10, 9, 7,
      9, 10, 12, 10, 7, 5, 4,
    ];
    const bass = [
      0, 0, 7, 0, 0, 0, 7, 7, 3, 3, 10, 3, 3, 3, 10, 10, 0, 0, 7, 0, 0, 0, 5, 5, 5, 5, 12, 5, 3, 3,
      10, 10,
    ];

    const tone = (f: number, t: number, d: number, type: OscillatorType, vol: number, dest: AudioNode) => {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(vol, t + 0.01);
      e.gain.exponentialRampToValueAtTime(0.001, t + d * 0.85);
      o.connect(e);
      e.connect(dest);
      o.start(t);
      o.stop(t + d);
    };
    const kick = (t: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.12);
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + 0.2);
    };
    const hat = (t: number, open: boolean) => {
      const d = open ? 0.18 : 0.05;
      const buf = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      src.connect(f);
      f.connect(g);
      g.connect(bus);
      src.start(t);
      src.stop(t + d);
    };

    const steps = melody.length;
    let next = ctx.currentTime + 0.05;
    let i = 0;
    const schedule = () => {
      while (next < ctx.currentTime + 0.1) {
        const si = i % steps;
        tone(scale[melody[si] % scale.length], next, step * 1.6, "sawtooth", 0.4, reverb);
        if (si % 2 === 0) tone(freq(bass[si] % 12), next, step * 2.8, "triangle", 0.55, bus);
        if (si % 8 === 0 || si % 8 === 4) kick(next);
        hat(next, si % 4 === 2);
        i++;
        next += step;
      }
      this.bgmTimer = window.setTimeout(schedule, 40);
    };
    schedule();
  }

  stopBGM(): void {
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmStarted = false;
  }
}
