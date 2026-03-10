import { state, dom, updateStatus } from './state.js';
import { showToast } from './utils/toast.js';
import { stopCamera } from './camera.js';

function buildExportCanvas() {
  if (!state.editedPixels) return null;
  const scale = Math.max(1, Math.floor(512 / state.pixW));
  const outW = state.pixW * scale, outH = state.pixH * scale;
  const tmp = document.createElement('canvas');
  tmp.width = outW;
  tmp.height = outH;
  const ctx = tmp.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  dom.canvasHidden.width = state.pixW;
  dom.canvasHidden.height = state.pixH;
  dom.ctxHidden.putImageData(state.editedPixels, 0, 0);
  ctx.drawImage(dom.canvasHidden, 0, 0, outW, outH);

  if (document.getElementById('wmToggle').checked) {
    const pad = Math.max(6, outW * 0.025);
    const fontSize = Math.max(8, outW * 0.028);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${fontSize}px 'Space Mono', monospace`;
    ctx.letterSpacing = '0.12em';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    ctx.fillText('PIXELCAM', outW - pad, outH - pad);
    ctx.restore();
  }
  return tmp;
}

function resetAll() {
  stopCamera();
  state.editedPixels = null;
  state.originalPixels = null;
  state.sourceCanvas = null;
  state.undoStack = [];
  state.redoStack = [];
  dom.canvasEditor.classList.add('hidden');
  document.getElementById('editorTools').classList.add('hidden');
  document.getElementById('colmodeBar').classList.remove('active');
  document.getElementById('editorPlaceholder').classList.remove('hidden');
  document.getElementById('btnStartCam').classList.remove('hidden');
  document.getElementById('btnCapture').classList.add('hidden');
  dom.canvasPreview.style.display = 'none';
  dom.video.style.filter = '';
  dom.video.style.transform = '';
  dom.video.classList.remove('mirrored');
  state.isMirrored = false;
  state.zoomLevel = 1;
  state.brightness = 0;
  state.contrast = 0;
  state.flashActive = false;
  state.timerSecs = 0;
  document.getElementById('zoomSlider').value = 1;
  document.getElementById('zoomVal').textContent = '1.0×';
  document.getElementById('brightnessSlider').value = 0;
  document.getElementById('brightnessVal').textContent = '0';
  document.getElementById('contrastSlider').value = 0;
  document.getElementById('contrastVal').textContent = '0';
  document.getElementById('btnTimer').textContent = '⏱ Timer: off';
  document.getElementById('btnTimer').classList.remove('active');
  document.getElementById('btnFlash').textContent = '⚡ Flash';
  document.getElementById('btnFlash').classList.remove('active');
  document.getElementById('btnMirror').textContent = '↔ Espelhar';
  document.getElementById('btnMirror').classList.remove('active');
  document.getElementById('btnFlipCam').textContent = '🔄 Virar câmera';
  document.getElementById('btnFlipCam').classList.remove('active');
  updateStatus();
}

export function initExport() {
  // Download
  document.getElementById('btnDownload').addEventListener('click', () => {
    const tmp = buildExportCanvas();
    if (!tmp) { showToast('Capture uma foto primeiro!', 'accent'); return; }
    const a = document.createElement('a');
    a.download = 'pixelcam.png';
    a.href = tmp.toDataURL();
    a.click();
    showToast('⬇️ Imagem salva!', 'success');
  });

  // Copy
  document.getElementById('btnCopy').addEventListener('click', async () => {
    const tmp = buildExportCanvas();
    if (!tmp) { showToast('Capture uma foto primeiro!', 'accent'); return; }
    try {
      const blob = await new Promise(resolve => tmp.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 Copiado para a área de transferência!', 'success');
    } catch {
      showToast('Não foi possível copiar', 'accent');
    }
  });

  // Share
  document.getElementById('btnShare').addEventListener('click', async () => {
    const tmp = buildExportCanvas();
    if (!tmp) { showToast('Capture uma foto primeiro!', 'accent'); return; }
    try {
      const blob = await new Promise(resolve => tmp.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'pixelcam.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'PixelCam', text: 'Olha minha arte pixel!', files: [file] });
        showToast('📤 Compartilhado!', 'success');
      } else if (navigator.share) {
        const dataUrl = tmp.toDataURL();
        await navigator.share({ title: 'PixelCam', text: 'Feito com PixelCam!', url: dataUrl });
      } else {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('📋 Copiado! (compartilhamento não suportado)', 'info');
      }
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Não foi possível compartilhar', 'accent');
    }
  });

  // Reset
  document.getElementById('btnReset').addEventListener('click', resetAll);
}