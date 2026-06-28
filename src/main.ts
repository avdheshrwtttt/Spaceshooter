import "./style.css";
import { Game } from "./core/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement;

const shipImg = new Image();
shipImg.src = "./spaceship.png";

// Kick off once the document is interactive. The image loading is non-blocking —
// the player falls back to a vector ship until the sprite is ready.
new Game(canvas, shipImg);
