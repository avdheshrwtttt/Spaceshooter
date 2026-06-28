// Keyboard-only input. Arrow keys steer on both axes, Space fires.

export class Input {
  private keys = new Set<string>();

  /** Horizontal axis from -1 (left) to 1 (right). */
  axisX = 0;
  /** Vertical axis from -1 (up) to 1 (down). */
  axisY = 0;
  firing = false;

  onPause = () => {};
  onAnyKey = () => {}; // used to unlock audio

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
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
    const left = this.keys.has("ArrowLeft");
    const right = this.keys.has("ArrowRight");
    const up = this.keys.has("ArrowUp");
    const down = this.keys.has("ArrowDown");
    this.axisX = (right ? 1 : 0) - (left ? 1 : 0);
    this.axisY = (down ? 1 : 0) - (up ? 1 : 0);
    this.firing = this.keys.has("Space");
  }

  /** Force-fire flag from an on-screen button (mobile). */
  setTouchFire(on: boolean) {
    this.firing = on || this.axisX !== 0 || this.axisY !== 0;
  }

  clear() {
    this.keys.clear();
    this.axisX = 0;
    this.axisY = 0;
    this.firing = false;
  }
}
