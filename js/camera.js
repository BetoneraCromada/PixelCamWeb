import { state, dom, TIMER_CYCLE } from './state.js';
import { showToast } from './utils/toast.js';
import { sampleFromSource, openEditor } from './editor.js';

function buildFilter() {
  const b = 1 + state.brightness / 100;
  const c = 1 + state.contrast / 100;
  return `brightness(${b * (state.flashActive ? 1.5 : 1)}) contrast(${c})`;
}

function applyVideoFilters() {
  const b = 1 + state.brightness / 100;
  const c = 1 + state.contrast / 100;
  dom.video.style.filter = `brightness(${b}) contrast(${c})`;
  const mirror = state.isMirrored ? 'scaleX(-1) ' : '';
  dom.video.style.transform = `${mirror}scale(${state.zoomLevel})`;
}

function showInactive() {
  document.getElementById('camInactive').classList.remove('hidden');
}

function hideInactive() {
  document.getElementById('camInactive').classList.add('hidden');
}

function startLivePreview() {
  dom.canvasPreview.style.display = 'block';
  state.previewInterval = setInterval(() => {
    if (dom.video.readyState < 2) return;
    dom.canvasHidden.width = state.pixW;
    dom.canvasHidden.height = state.pixH;
    dom.ctxHidden.filter = buildFilter();
    if (state.isMirrored) {
      dom.ctxHidden.save();
      dom.ctxHidden.translate(state.pixW, 0);
      dom.ctxHidden.scale(-1, 1);
    }
    dom.ctxHidden.drawImage(dom.video, 0, 0, state.pixW, state.pixH);
    if (state.isMirrored) dom.ctxHidden.restore();
    dom.ctxHidden.filter = 'none';
    dom.canvasPreview.width = dom.canvasPreview.offsetWidth || 320;
    dom.canvasPreview.height = dom.canvasPreview.offsetHeight || 240;
    const ctx2 = dom.canvasPreview.getContext('2d');
    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(dom.canvasHidden, 0, 0, dom.canvasPreview.width, dom.canvasPreview.height);
  }, 80);
}

export async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Câmera requer HTTPS ou localhost!', 'accent');
      console.warn('mediaDevices indisponível — site precisa ser servido via HTTPS');
      return;
    }
    if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    dom.video.srcObject = state.stream;
    await dom.video.play();
    hideInactive();
    document.getElementById('btnStartCam').classList.add('hidden');
    document.getElementById('btnCapture').classList.remove('hidden');
    document.getElementById('camControls').classList.add('active');
    applyVideoFilters();
    startLivePreview();
  } catch (e) {
    console.error('Erro ao acessar câmera:', e);
    if (e.name === 'NotAllowedError') {
      showToast('Permissão de câmera negada. Verifique as configurações.', 'accent');
    } else if (e.name === 'NotFoundError') {
      showToast('Nenhuma câmera encontrada neste dispositivo.', 'accent');
    } else if (e.name === 'NotReadableError' || e.name === 'AbortError') {
      showToast('Câmera em uso por outro app. Feche e tente novamente.', 'accent');
    } else {
      showToast('Câmera não disponível. Use o upload!', 'accent');
    }
  }
}

export function stopCamera() {
  if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
  clearInterval(state.previewInterval);
  state.previewInterval = null;
  if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  document.getElementById('camControls').classList.remove('active');
  showInactive();
}

function flashEffect() {
  const flash = document.createElement('div');
  flash.className = 'capture-flash';
  document.getElementById('viewfinderWrap').appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());
}

function doCapture() {
  flashEffect();
  clearInterval(state.previewInterval);
  state.sourceCanvas = document.createElement('canvas');
  state.sourceCanvas.width = dom.video.videoWidth || 640;
  state.sourceCanvas.height = dom.video.videoHeight || 480;
  const sCtx = state.sourceCanvas.getContext('2d');
  sCtx.filter = buildFilter();
  if (state.isMirrored) {
    sCtx.save();
    sCtx.translate(state.sourceCanvas.width, 0);
    sCtx.scale(-1, 1);
  }
  sCtx.drawImage(dom.video, 0, 0, state.sourceCanvas.width, state.sourceCanvas.height);
  if (state.isMirrored) sCtx.restore();
  sCtx.filter = 'none';
  sampleFromSource('crop');
  stopCamera();
  openEditor();
  showToast('📸 Foto capturada!', 'success');
}

function runTimer() {
  let rem = state.timerSecs;
  const badge = document.getElementById('camBadge');
  badge.textContent = `⏱ ${rem}s`;
  state.timerHandle = setInterval(() => {
    rem--;
    if (rem > 0) {
      badge.textContent = `⏱ ${rem}s`;
    } else {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
      badge.textContent = '● REC';
      doCapture();
    }
  }, 1000);
}

function handleFile(file) {
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    state.sourceCanvas = document.createElement('canvas');
    state.sourceCanvas.width = img.naturalWidth;
    state.sourceCanvas.height = img.naturalHeight;
    state.sourceCanvas.getContext('2d').drawImage(img, 0, 0);
    sampleFromSource('crop');
    stopCamera();
    openEditor();
    showToast('🖼️ Foto carregada!', 'success');
  };
  img.src = URL.createObjectURL(file);
}

export function initCamera() {
  // Start / inactive click
  document.getElementById('btnStartCam').addEventListener('click', startCamera);
  document.getElementById('camInactive').addEventListener('click', startCamera);

  // Capture
  document.getElementById('btnCapture').addEventListener('click', () => {
    if (!state.stream) return;
    if (state.timerSecs > 0) runTimer(); else doCapture();
  });

  // Flip camera
  document.getElementById('btnFlipCam').addEventListener('click', async () => {
    state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
    const btn = document.getElementById('btnFlipCam');
    btn.textContent = state.facingMode === 'user' ? '🔄 Câm. Traseira' : '🔄 Câm. Frontal';
    btn.classList.toggle('active', state.facingMode === 'user');
    clearInterval(state.previewInterval);
    await startCamera();
  });

  // Mirror
  document.getElementById('btnMirror').addEventListener('click', () => {
    state.isMirrored = !state.isMirrored;
    dom.video.classList.toggle('mirrored', state.isMirrored);
    const btn = document.getElementById('btnMirror');
    btn.classList.toggle('active', state.isMirrored);
    btn.textContent = state.isMirrored ? '↔ Espelhado ✓' : '↔ Espelhar';
  });

  // Timer
  document.getElementById('btnTimer').addEventListener('click', () => {
    const idx = (TIMER_CYCLE.indexOf(state.timerSecs) + 1) % TIMER_CYCLE.length;
    state.timerSecs = TIMER_CYCLE[idx];
    const btn = document.getElementById('btnTimer');
    btn.textContent = state.timerSecs === 0 ? '⏱ Timer: off' : `⏱ ${state.timerSecs}s`;
    btn.classList.toggle('active', state.timerSecs > 0);
  });

  // Flash
  document.getElementById('btnFlash').addEventListener('click', () => {
    state.flashActive = !state.flashActive;
    const btn = document.getElementById('btnFlash');
    btn.classList.toggle('active', state.flashActive);
    btn.textContent = state.flashActive ? '⚡ Flash: on' : '⚡ Flash';
  });

  // Zoom
  document.getElementById('zoomSlider').addEventListener('input', e => {
    state.zoomLevel = parseFloat(e.target.value);
    document.getElementById('zoomVal').textContent = state.zoomLevel.toFixed(1) + '×';
    applyVideoFilters();
    const ind = document.getElementById('zoomIndicator');
    ind.textContent = state.zoomLevel.toFixed(1) + '×';
    ind.classList.add('show');
    clearTimeout(state.zoomHideTimer);
    state.zoomHideTimer = setTimeout(() => ind.classList.remove('show'), 1500);
  });

  // Brightness
  document.getElementById('brightnessSlider').addEventListener('input', e => {
    state.brightness = +e.target.value;
    document.getElementById('brightnessVal').textContent = state.brightness;
    applyVideoFilters();
  });

  // Contrast
  document.getElementById('contrastSlider').addEventListener('input', e => {
    state.contrast = +e.target.value;
    document.getElementById('contrastVal').textContent = state.contrast;
    applyVideoFilters();
  });

  // Upload
  const uploadDrop = document.getElementById('uploadDrop');
  uploadDrop.addEventListener('click', () => document.getElementById('fileInput').click());
  uploadDrop.addEventListener('dragover', e => { e.preventDefault(); uploadDrop.style.borderColor = 'var(--accent2)'; });
  uploadDrop.addEventListener('dragleave', () => { uploadDrop.style.borderColor = ''; });
  uploadDrop.addEventListener('drop', e => { e.preventDefault(); uploadDrop.style.borderColor = ''; handleFile(e.dataTransfer.files[0]); });
  document.getElementById('fileInput').addEventListener('change', e => handleFile(e.target.files[0]));
}