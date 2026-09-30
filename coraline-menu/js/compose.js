// Compose mode (?compose=1): instead of rendering the 3D scene, show a saved background frame
// and draw the menu over it. Used by tools/render.mjs to re-export text changes quickly.
import { setOverlay } from './timeline.js';

const canvas = document.getElementById('scene');
const frame = document.createElement('img');
frame.id = 'scene';
frame.alt = '';
frame.width = 1920;
frame.height = 1080;
canvas.replaceWith(frame);

window.__render = async (t, src) => {
  if (src && !frame.src.endsWith(src)) {
    frame.src = src;
    await frame.decode();
  }
  setOverlay(t);
  return true;
};
await document.fonts.ready;
window.__ready = true;
