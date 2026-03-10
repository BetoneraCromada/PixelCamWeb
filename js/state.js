export const state = {
  pixW: 160,
  pixH: 120,
  basePixels: 160,
  arW: 4,
  arH: 3,
  sourceCanvas: null,
  originalPixels: null,
  editedPixels: null,
  undoStack: [],
  redoStack: [],
  currentTool: 'paint',
  selectedColor: '#ff3d6e',
  palette: ['#ff3d6e', '#ffce00', '#00e5ff', '#b967ff', '#00ff9f', '#ff6b35', '#ffffff', '#0a0a0f'],
  stream: null,
  isDrawing: false,
  colMode: 'original',
  depthDir: 'dark-to-light',
  facingMode: 'environment',
  isMirrored: false,
  timerSecs: 0,
  timerHandle: null,
  zoomLevel: 1,
  brightness: 0,
  contrast: 0,
  flashActive: false,
  previewInterval: null,
  zoomHideTimer: null,
  pendingResize: null,
  lastResizeMode: 'crop',
};

export const TIMER_CYCLE = [0, 3, 5, 10];
export const STORAGE_PALETTES = 'pixelcam_custom_palettes';
export const STORAGE_CURRENT = 'pixelcam_current_palette';

export const dom = {};

export function initDOM() {
  dom.video = document.getElementById('videoEl');
  dom.canvasPreview = document.getElementById('canvasPreview');
  dom.canvasEditor = document.getElementById('canvasEditor');
  dom.canvasHidden = document.getElementById('canvasHidden');
  dom.ctxEditor = dom.canvasEditor.getContext('2d');
  dom.ctxHidden = dom.canvasHidden.getContext('2d');
}

export function updateStatus() {
  const toolNames = { paint: 'pincel', fill: 'balde', erase: 'apagar' };
  document.getElementById('statusRes').textContent = `${state.pixW}×${state.pixH}`;
  document.getElementById('statusTool').textContent = `Ferramenta: ${toolNames[state.currentTool] || state.currentTool}`;
  document.getElementById('statusColorDot').style.background = state.selectedColor;
}