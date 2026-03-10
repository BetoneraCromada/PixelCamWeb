import { state } from './state.js';
import { setTool } from './editor.js';

export function initShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      document.getElementById('btnUndo').click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      document.getElementById('btnRedo').click();
    } else if (e.key === '1') {
      setTool('paint');
    } else if (e.key === '2') {
      setTool('fill');
    } else if (e.key === '3') {
      setTool('erase');
    } else if (e.key === ' ' && state.stream) {
      e.preventDefault();
      document.getElementById('btnCapture').click();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.getElementById('btnDownload').click();
    }
  });
}