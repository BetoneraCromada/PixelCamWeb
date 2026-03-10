import { state, dom, updateStatus } from './state.js';
import { showToast } from './utils/toast.js';
import { hexToRgb, colorDist, luma, lerp } from './utils/color.js';

export function sampleFromSource(mode = 'crop') {
  if (!state.sourceCanvas) return;
  dom.canvasHidden.width = state.pixW;
  dom.canvasHidden.height = state.pixH;
  dom.ctxHidden.imageSmoothingEnabled = true;
  dom.ctxHidden.imageSmoothingQuality = 'high';

  const srcW = state.sourceCanvas.width, srcH = state.sourceCanvas.height;
  if (mode === 'crop') {
    const srcAR = srcW / srcH, dstAR = state.pixW / state.pixH;
    let sx, sy, sw, sh;
    if (srcAR > dstAR) {
      sh = srcH; sw = srcH * dstAR; sx = (srcW - sw) / 2; sy = 0;
    } else {
      sw = srcW; sh = srcW / dstAR; sx = 0; sy = (srcH - sh) / 2;
    }
    dom.ctxHidden.drawImage(state.sourceCanvas, sx, sy, sw, sh, 0, 0, state.pixW, state.pixH);
  } else {
    dom.ctxHidden.drawImage(state.sourceCanvas, 0, 0, state.pixW, state.pixH);
  }

  state.originalPixels = dom.ctxHidden.getImageData(0, 0, state.pixW, state.pixH);
  state.editedPixels = new ImageData(new Uint8ClampedArray(state.originalPixels.data), state.pixW, state.pixH);
  state.undoStack = [];
  state.redoStack = [];
}

export function openEditor() {
  document.getElementById('editorPlaceholder').classList.add('hidden');
  dom.canvasEditor.classList.remove('hidden');
  document.getElementById('editorTools').classList.remove('hidden');
  document.getElementById('colmodeBar').classList.add('active');
  state.colMode = 'original';
  document.querySelectorAll('.colmode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.colmode-btn[data-mode="original"]').classList.add('active');
  document.getElementById('depthOpts').classList.add('hidden');
  state.undoStack = [];
  state.redoStack = [];
  renderEditor();
  updateStatus();
}

export function renderEditor() {
  dom.canvasEditor.width = dom.canvasEditor.offsetWidth || 320;
  dom.canvasEditor.height = dom.canvasEditor.offsetWidth * (state.pixH / state.pixW);
  dom.ctxEditor.imageSmoothingEnabled = false;
  dom.canvasHidden.width = state.pixW;
  dom.canvasHidden.height = state.pixH;
  dom.ctxHidden.putImageData(state.editedPixels, 0, 0);
  dom.ctxEditor.drawImage(dom.canvasHidden, 0, 0, dom.canvasEditor.width, dom.canvasEditor.height);
}

export function applyColorization() {
  if (!state.originalPixels) return;
  pushUndo();
  const src = state.originalPixels.data, dst = state.editedPixels.data;

  if (state.colMode === 'original') {
    for (let i = 0; i < src.length; i++) dst[i] = src[i];
  } else if (state.colMode === 'grayscale') {
    for (let i = 0; i < src.length; i += 4) {
      const l = Math.round(luma(src[i], src[i + 1], src[i + 2]));
      dst[i] = dst[i + 1] = dst[i + 2] = l;
      dst[i + 3] = 255;
    }
  } else if (state.colMode === 'palette') {
    if (!state.palette.length) return;
    const pal = state.palette.map(hexToRgb);
    for (let i = 0; i < src.length; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2];
      let best = pal[0], bd = Infinity;
      for (const p of pal) {
        const d = colorDist(r, g, b, ...p);
        if (d < bd) { bd = d; best = p; }
      }
      dst[i] = best[0]; dst[i + 1] = best[1]; dst[i + 2] = best[2]; dst[i + 3] = 255;
    }
  } else if (state.colMode === 'depth') {
    if (!state.palette.length) return;
    const pal = state.palette.map(hexToRgb), n = pal.length - 1;
    for (let i = 0; i < src.length; i += 4) {
      let l = luma(src[i], src[i + 1], src[i + 2]) / 255;
      if (state.depthDir === 'light-to-dark') l = 1 - l;
      const pos = l * n, lo = Math.floor(pos), hi = Math.min(lo + 1, n), t = pos - lo;
      const c = lerp(pal[lo], pal[hi], t);
      dst[i] = c[0]; dst[i + 1] = c[1]; dst[i + 2] = c[2]; dst[i + 3] = 255;
    }
  } else if (state.colMode === 'duotone') {
    if (state.palette.length < 2) return;
    const sh = hexToRgb(state.palette[0]), li = hexToRgb(state.palette[state.palette.length - 1]);
    for (let i = 0; i < src.length; i += 4) {
      const t = luma(src[i], src[i + 1], src[i + 2]) / 255;
      const c = lerp(sh, li, t);
      dst[i] = c[0]; dst[i + 1] = c[1]; dst[i + 2] = c[2]; dst[i + 3] = 255;
    }
  }
  renderEditor();
}

function pushUndo() {
  state.undoStack.push(new Uint8ClampedArray(state.editedPixels.data));
  if (state.undoStack.length > 30) state.undoStack.shift();
  state.redoStack = [];
}

function getCoords(e) {
  const rect = dom.canvasEditor.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return {
    px: Math.max(0, Math.min(state.pixW - 1, Math.floor((s.clientX - rect.left) * state.pixW / dom.canvasEditor.width))),
    py: Math.max(0, Math.min(state.pixH - 1, Math.floor((s.clientY - rect.top) * state.pixH / dom.canvasEditor.height)))
  };
}

function paintPx(px, py) {
  const i = (py * state.pixW + px) * 4;
  const [r, g, b] = hexToRgb(state.selectedColor);
  state.editedPixels.data[i] = r;
  state.editedPixels.data[i + 1] = g;
  state.editedPixels.data[i + 2] = b;
  state.editedPixels.data[i + 3] = 255;
}

function erasePx(px, py) {
  const i = (py * state.pixW + px) * 4;
  for (let j = 0; j < 4; j++) {
    state.editedPixels.data[i + j] = state.originalPixels.data[i + j];
  }
}

function floodFill(px, py, tc, fc) {
  const stack = [[px, py]];
  const [tr, tg, tb] = tc, [fr, fg, fb] = fc;
  if (tr === fr && tg === fg && tb === fb) return;
  const vis = new Set();
  const d = state.editedPixels.data;
  const w = state.pixW, h = state.pixH;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const k = y * w + x;
    if (vis.has(k)) continue;
    const i = k * 4;
    if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb) continue;
    vis.add(k);
    d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function doTool(px, py) {
  if (state.currentTool === 'paint') paintPx(px, py);
  else if (state.currentTool === 'erase') erasePx(px, py);
}

function onDown(e) {
  if (!state.editedPixels) return;
  state.isDrawing = true;
  const { px, py } = getCoords(e);
  pushUndo();
  if (state.currentTool === 'fill') {
    const i = (py * state.pixW + px) * 4;
    const d = state.editedPixels.data;
    floodFill(px, py, [d[i], d[i + 1], d[i + 2]], hexToRgb(state.selectedColor));
    renderEditor();
    state.isDrawing = false;
    return;
  }
  doTool(px, py);
  renderEditor();
}

function onMove(e) {
  if (!state.isDrawing || !state.editedPixels) return;
  const { px, py } = getCoords(e);
  doTool(px, py);
  renderEditor();
}

function onUp() {
  state.isDrawing = false;
}

export function setTool(t) {
  state.currentTool = t;
  document.querySelectorAll('.tool-btn[id^="tool"]').forEach(b => b.classList.remove('active'));
  document.getElementById('tool' + t[0].toUpperCase() + t.slice(1)).classList.add('active');
  updateStatus();
}

export function retakePhoto() {
  state.sourceCanvas = null;
  state.originalPixels = null;
  state.editedPixels = null;
  state.undoStack = [];
  state.redoStack = [];
  dom.canvasEditor.classList.add('hidden');
  document.getElementById('editorTools').classList.add('hidden');
  document.getElementById('colmodeBar').classList.remove('active');
  document.getElementById('editorPlaceholder').classList.remove('hidden');
  document.getElementById('btnStartCam').classList.remove('hidden');
  document.getElementById('btnCapture').classList.add('hidden');
  dom.canvasPreview.style.display = 'none';
  document.getElementById('camInactive').classList.remove('hidden');
  updateStatus();
}

export function initEditor() {
  // Canvas drawing events
  dom.canvasEditor.addEventListener('mousedown', onDown);
  dom.canvasEditor.addEventListener('mousemove', onMove);
  dom.canvasEditor.addEventListener('mouseup', onUp);
  dom.canvasEditor.addEventListener('touchstart', e => { e.preventDefault(); onDown(e); }, { passive: false });
  dom.canvasEditor.addEventListener('touchmove', e => { e.preventDefault(); onMove(e); }, { passive: false });
  dom.canvasEditor.addEventListener('touchend', onUp);

  // Tool buttons
  document.getElementById('toolPaint').addEventListener('click', () => setTool('paint'));
  document.getElementById('toolFill').addEventListener('click', () => setTool('fill'));
  document.getElementById('toolErase').addEventListener('click', () => setTool('erase'));
  document.getElementById('btnRetake').addEventListener('click', retakePhoto);

  // Undo / redo
  document.getElementById('btnUndo').addEventListener('click', () => {
    if (!state.undoStack.length) return;
    state.redoStack.push(new Uint8ClampedArray(state.editedPixels.data));
    state.editedPixels = new ImageData(state.undoStack.pop(), state.pixW, state.pixH);
    renderEditor();
  });

  document.getElementById('btnRedo').addEventListener('click', () => {
    if (!state.redoStack.length) return;
    state.undoStack.push(new Uint8ClampedArray(state.editedPixels.data));
    state.editedPixels = new ImageData(state.redoStack.pop(), state.pixW, state.pixH);
    renderEditor();
  });

  // Colorization mode
  document.getElementById('colmodeBar').addEventListener('click', e => {
    const mb = e.target.closest('.colmode-btn');
    if (mb) {
      state.colMode = mb.dataset.mode;
      document.querySelectorAll('.colmode-btn').forEach(b => b.classList.remove('active'));
      mb.classList.add('active');
      document.getElementById('depthOpts').classList.toggle('hidden', state.colMode !== 'depth');
      applyColorization();
      return;
    }
    const db = e.target.closest('.depth-dir');
    if (db) {
      state.depthDir = db.dataset.dir;
      document.querySelectorAll('.depth-dir').forEach(b => b.classList.remove('active'));
      db.classList.add('active');
      applyColorization();
    }
  });

  // Resize rerender
  window.addEventListener('resize', () => {
    if (state.editedPixels) renderEditor();
  });
}