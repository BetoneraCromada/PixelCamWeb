import { state, dom, updateStatus } from './state.js';
import { showToast } from './utils/toast.js';
import { sampleFromSource, applyColorization } from './editor.js';

export function computeDimensions() {
  state.pixW = state.basePixels;
  state.pixH = Math.max(1, Math.round(state.basePixels * state.arH / state.arW));
}

export function updateViewfinderAR() {
  document.getElementById('viewfinderWrap').style.aspectRatio = `${state.arW}/${state.arH}`;
  dom.canvasEditor.style.aspectRatio = `${state.arW}/${state.arH}`;
}

function updateARButtons() {
  document.querySelectorAll('.ar-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.w === state.arW && +b.dataset.h === state.arH);
  });
}

function updateResButtons() {
  document.querySelectorAll('.res-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.base === state.basePixels);
  });
}

function showResizeModal() {
  document.getElementById('resizeModal').classList.remove('hidden');
  renderResizePreviews();
}

function hideResizeModal() {
  document.getElementById('resizeModal').classList.add('hidden');
}

function renderResizePreviews() {
  if (!state.sourceCanvas) return;
  renderPreviewCanvas('previewCrop', 'crop');
  renderPreviewCanvas('previewStretch', 'stretch');
}

function renderPreviewCanvas(canvasId, mode) {
  const c = document.getElementById(canvasId);
  const pw = 60, ph = Math.round(60 * state.pixH / state.pixW);
  c.width = pw;
  c.height = ph;
  c.style.height = ph + 'px';
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcW = state.sourceCanvas.width, srcH = state.sourceCanvas.height;
  if (mode === 'crop') {
    const srcAR = srcW / srcH, dstAR = state.pixW / state.pixH;
    let sx, sy, sw, sh;
    if (srcAR > dstAR) {
      sh = srcH; sw = srcH * dstAR; sx = (srcW - sw) / 2; sy = 0;
    } else {
      sw = srcW; sh = srcW / dstAR; sx = 0; sy = (srcH - sh) / 2;
    }
    ctx.drawImage(state.sourceCanvas, sx, sy, sw, sh, 0, 0, pw, ph);
  } else {
    ctx.drawImage(state.sourceCanvas, 0, 0, pw, ph);
  }
}

function confirmResize(mode) {
  state.lastResizeMode = mode;
  sampleFromSource(mode);
  applyColorization();
  updateStatus();
  state.pendingResize = null;
  hideResizeModal();
  showToast(mode === 'crop' ? '✂️ Imagem cortada!' : '↔️ Imagem esticada!', 'success');
}

function cancelResize() {
  if (state.pendingResize) {
    state.arW = state.pendingResize.prevArW;
    state.arH = state.pendingResize.prevArH;
    state.basePixels = state.pendingResize.prevBase;
    computeDimensions();
    updateViewfinderAR();
    updateARButtons();
    updateResButtons();
    state.pendingResize = null;
  }
  hideResizeModal();
}

export function initResize() {
  // Aspect ratio click
  document.getElementById('arGrid').addEventListener('click', e => {
    const btn = e.target.closest('.ar-btn');
    if (!btn) return;
    const newW = +btn.dataset.w, newH = +btn.dataset.h;
    if (newW === state.arW && newH === state.arH) return;
    if (state.sourceCanvas) {
      state.pendingResize = {
        arW: newW, arH: newH, base: state.basePixels,
        prevArW: state.arW, prevArH: state.arH, prevBase: state.basePixels
      };
      state.arW = newW; state.arH = newH;
      computeDimensions(); updateViewfinderAR(); updateARButtons();
      showResizeModal();
    } else {
      state.arW = newW; state.arH = newH;
      computeDimensions(); updateViewfinderAR(); updateARButtons(); updateStatus();
    }
  });

  // Resolution click
  document.getElementById('resGrid').addEventListener('click', e => {
    const btn = e.target.closest('.res-btn');
    if (!btn) return;
    const newBase = +btn.dataset.base;
    if (newBase === state.basePixels) return;
    if (state.sourceCanvas) {
      state.pendingResize = {
        arW: state.arW, arH: state.arH, base: newBase,
        prevArW: state.arW, prevArH: state.arH, prevBase: state.basePixels
      };
      state.basePixels = newBase;
      computeDimensions(); updateResButtons();
      showResizeModal();
    } else {
      state.basePixels = newBase;
      computeDimensions(); updateResButtons(); updateStatus();
    }
  });

  // Modal buttons
  document.getElementById('optCrop').addEventListener('click', () => confirmResize('crop'));
  document.getElementById('optStretch').addEventListener('click', () => confirmResize('stretch'));
  document.getElementById('btnCancelResize').addEventListener('click', cancelResize);
  document.getElementById('resizeModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) cancelResize();
  });
}