import { initDOM, updateStatus } from './state.js';
import { loadPaletteState } from './palette.js';
import { computeDimensions, updateViewfinderAR, initResize } from './resize.js';
import { initCamera } from './camera.js';
import { initEditor } from './editor.js';
import { initPalette } from './palette.js';
import { initExport } from './export.js';
import { initShortcuts } from './shortcuts.js';

// Init DOM references
initDOM();

// Load saved palette
loadPaletteState();

// Compute initial dimensions
computeDimensions();
updateViewfinderAR();

// Init all modules
initEditor();
initCamera();
initResize();
initPalette();
initExport();
initShortcuts();

// Initial status
updateStatus();