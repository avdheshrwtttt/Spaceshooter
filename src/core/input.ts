// Keyboard + touch/pointer input. Exposes a simple polled state plus events.

export class Input {
  private keys = new Set<string>();

  /** Horizontal axis from -1 (left) to 1 (right), keyboard only. */
  axis = 0;
  firing = false;

  /** Absolute target X from touch/drag, or null when not steering by pointer. */
  pointerX: number | null = null;

  onPause = () => {};
  onShoot = () => {}; // single-press shoot (menus etc. ignore)
  onAnyKey = () => {}; // used to unlock audio

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    canvas.addEventListener("pointerdown", this.handlePointer);
    canvas.addEventListener("pointermove", this.handlePointer);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code))
      e.preventDefault();
    this.onAnyKey();
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code === "KeyP" || e.code === "Escape") this.onPause();
    this.recompute();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    this.recompute();
  };

  private recompute() {
    const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    const right = this.keys.has("ArrowRight") || this.keys.has("KeyD");
    this.axis = (right ? 1 : 0) - (left ? 1 : 0);
    this.firing = this.keys.has("Space");
  }

  private handlePointer = (e: PointerEvent) => {
    this.onAnyKey();
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.firing = true; // touch = steer + auto-fire
  };

  private handlePointerUp = () => {
    this.pointerX = null;
    if (this.axis === 0) this.firing = false;
  };

  /** Force-fire flag from an on-screen button. */
  setTouchFire(on: boolean) {
    this.firing = on || this.axis !== 0 || this.pointerX !== null;
  }

  clear() {
    this.keys.clear();
    this.axis = 0;
    this.firing = false;
    this.pointerX = null;
  }
}
