import { state, STORAGE_PALETTES, STORAGE_CURRENT, updateStatus } from './state.js';
import { showToast } from './utils/toast.js';
import { hslToHex } from './utils/color.js';
import { applyColorization } from './editor.js';

// 6 cores cada, organizadas escuro → claro
const PRESETS = [
  { name: 'Pastel Dreamy', colors: ['#4a3258', '#c4b5fd', '#f9a8d4', '#93c5fd', '#86efac', '#fde68a'] },
  { name: 'Cyberpunk', colors: ['#0a0014', '#9900ff', '#ff0090', '#ff6600', '#00fff7', '#ffe600'] },
  { name: 'Earth Tones', colors: ['#2e1a00', '#713f12', '#854d0e', '#a16207', '#d97706', '#fbbf24'] },
  { name: 'Arctic', colors: ['#0c4a6e', '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe'] },
  { name: 'Lava', colors: ['#450a0a', '#991b1b', '#dc2626', '#ef4444', '#fca5a5', '#fef2f2'] },
  { name: 'GameBoy', colors: ['#0f380f', '#1e4a1e', '#306230', '#8bac0f', '#9bbc0f', '#c4cfa1'] },
  { name: 'Noir', colors: ['#000000', '#262626', '#555555', '#888888', '#bbbbbb', '#ffffff'] },
  { name: 'Sunset', colors: ['#1a0510', '#8e2557', '#c0392b', '#ff6b35', '#f7931e', '#ffcd00'] },
  { name: 'Oceano', colors: ['#001020', '#001f3f', '#003366', '#0074D9', '#39CCCC', '#c8f0ff'] },
  { name: 'Floresta', colors: ['#061210', '#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#b7e4c7'] },
  { name: 'Neon', colors: ['#050505', '#7700aa', '#ff00ff', '#00ff00', '#00ffff', '#ffff00'] },
  { name: 'Vintage', colors: ['#1c0f06', '#6b4226', '#8b6914', '#a67c52', '#c9956b', '#e8d0b0'] },
];

let selectedIndex = -1;
let editingIndex = -1;

function norm(h) { return h.toLowerCase(); }

export function syncColorInputs(col) {
  document.getElementById('colorPicker').value = col;
  document.getElementById('hexInput').value = col;
}

export function savePaletteState() {
  localStorage.setItem(STORAGE_CURRENT, JSON.stringify(state.palette));
}

export function loadPaletteState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_CURRENT));
    if (saved && saved.length) {
      state.palette = saved;
      state.selectedColor = state.palette[0];
      syncColorInputs(state.selectedColor);
    }
  } catch {}
}

function loadCustomPalettes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PALETTES)) || []; }
  catch { return []; }
}

function saveCustomPalettesToStorage(palettes) {
  localStorage.setItem(STORAGE_PALETTES, JSON.stringify(palettes));
}

function updateCustomCount() {
  document.getElementById('customCount').textContent = loadCustomPalettes().length;
}

function applyPalette(colors, name) {
  state.palette = [...colors];
  state.selectedColor = state.palette[0];
  selectedIndex = 0;
  syncColorInputs(state.selectedColor);
  renderPalette();
  updateStatus();
  savePaletteState();
  if (state.colMode !== 'original' && state.colMode !== 'grayscale') applyColorization();
  showToast(`Paleta "${name}" carregada!`, 'success');
}

function updateSwatchActions() {
  const bar = document.getElementById('swatchActions');
  const preview = document.getElementById('swatchActPreview');
  if (selectedIndex < 0 || selectedIndex >= state.palette.length) {
    bar.classList.add('hidden');
    return;
  }
  const col = state.palette[selectedIndex];
  preview.style.background = col;
  bar.classList.remove('hidden');
}

export function renderPalette() {
  const g = document.getElementById('paletteGrid');
  g.innerHTML = '';

  // Clamp selectedIndex
  if (selectedIndex >= state.palette.length) selectedIndex = state.palette.length - 1;
  if (!state.palette.length) selectedIndex = -1;

  state.palette.forEach((col, i) => {
    const s = document.createElement('div');
    s.className = 'swatch' + (i === selectedIndex ? ' selected' : '');
    s.style.background = col;
    s.title = col;

    const d = document.createElement('div');
    d.className = 'del';
    d.textContent = '×';
    d.addEventListener('click', e => {
      e.stopPropagation();
      removeSwatch(i);
    });
    s.appendChild(d);

    s.addEventListener('click', () => {
      selectedIndex = i;
      state.selectedColor = col;
      editingIndex = -1;
      syncColorInputs(col);
      renderPalette();
      updateStatus();
    });

    g.appendChild(s);
  });

  updateSwatchActions();
}

function removeSwatch(i) {
  state.palette.splice(i, 1);
  if (selectedIndex === i) {
    selectedIndex = Math.min(i, state.palette.length - 1);
    state.selectedColor = state.palette[selectedIndex] || '#ffffff';
    syncColorInputs(state.selectedColor);
  } else if (selectedIndex > i) {
    selectedIndex--;
  }
  editingIndex = -1;
  renderPalette();
  updateStatus();
  savePaletteState();
  if (state.colMode === 'palette' || state.colMode === 'depth' || state.colMode === 'duotone') {
    applyColorization();
  }
}

function renderPresetPalettes() {
  const pa = document.getElementById('presetsArea');
  pa.innerHTML = '';
  PRESETS.forEach(p => {
    const row = document.createElement('div');
    row.className = 'preset-row';
    row.innerHTML = `
      <div class="preset-colors">${p.colors.map(c => `<div class="preset-dot" style="background:${c}"></div>`).join('')}</div>
      <div class="preset-name">${p.name}</div>`;
    row.addEventListener('click', () => applyPalette(p.colors, p.name));
    pa.appendChild(row);
  });
}

function renderCustomPalettes() {
  const ca = document.getElementById('customArea');
  ca.innerHTML = '';
  const customs = loadCustomPalettes();
  if (!customs.length) {
    ca.innerHTML = '<div class="custom-empty">Nenhuma paleta salva ainda.<br>Crie uma paleta e clique em "Salvar"!</div>';
    return;
  }
  customs.forEach(p => {
    const row = document.createElement('div');
    row.className = 'preset-row';
    const colorsHtml = p.colors.slice(0, 8).map(c => `<div class="preset-dot" style="background:${c}"></div>`).join('');
    row.innerHTML = `
      <div class="preset-colors">${colorsHtml}</div>
      <div class="preset-name" data-id="${p.id}">${p.name}</div>
      <div class="custom-actions">
        <button class="custom-act edit" data-action="rename" data-id="${p.id}" title="Renomear">✏️</button>
        <button class="custom-act" data-action="delete" data-id="${p.id}" title="Excluir">🗑️</button>
      </div>`;
    row.addEventListener('click', e => {
      if (e.target.closest('.custom-actions')) return;
      if (row.querySelector('.rename-input')) return;
      applyPalette(p.colors, p.name);
    });
    row.querySelectorAll('.custom-act').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = +btn.dataset.id;
        if (btn.dataset.action === 'delete') {
          let customs = loadCustomPalettes();
          customs = customs.filter(x => x.id !== id);
          saveCustomPalettesToStorage(customs);
          renderCustomPalettes();
          updateCustomCount();
          showToast(`Paleta "${p.name}" excluída`, 'info');
        } else if (btn.dataset.action === 'rename') {
          startRename(row, id);
        }
      });
    });
    ca.appendChild(row);
  });
}

function startRename(row, id) {
  const nameEl = row.querySelector('.preset-name');
  const oldName = nameEl.textContent;
  const input = document.createElement('input');
  input.className = 'rename-input';
  input.value = oldName;
  input.maxLength = 30;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  const finish = (save) => {
    const newName = input.value.trim();
    if (save && newName && newName !== oldName) {
      const customs = loadCustomPalettes();
      const p = customs.find(x => x.id === id);
      if (p) { p.name = newName; saveCustomPalettesToStorage(customs); }
      showToast(`Renomeada para "${newName}"`, 'success');
    }
    renderCustomPalettes();
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

function generateRandomPalette() {
  const count = 6;
  const isLinear = Math.random() < 0.78;

  if (isLinear) {
    // Gradiente linear escuro → claro (funciona melhor na maioria das fotos)
    const baseHue = Math.random() * 360;
    const hueSpread = 10 + Math.random() * 30;
    const baseSat = 40 + Math.random() * 40;

    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const h = (baseHue + (t - 0.5) * hueSpread + 360) % 360;
      const s = baseSat + (Math.random() * 8 - 4);
      const l = 8 + t * 78 + (Math.random() * 5 - 2.5);
      return hslToHex(h, Math.max(15, Math.min(95, s)), Math.max(6, Math.min(92, l)));
    });
  }

  // Variante criativa (menos frequente, mantém escuro→claro)
  const baseHue = Math.random() * 360;
  const offsets = [0, 30 + Math.random() * 30, 60 + Math.random() * 60, 120, 180, 240 + Math.random() * 60];
  return offsets.map((off, i) => {
    const t = i / (count - 1);
    const h = (baseHue + off) % 360;
    const s = 45 + Math.random() * 35;
    const l = 10 + t * 72 + (Math.random() * 8 - 4);
    return hslToHex(h, Math.max(20, Math.min(90, s)), Math.max(8, Math.min(90, l)));
  });
}

function doSavePalette() {
  const name = document.getElementById('saveName').value.trim();
  if (!name) { showToast('Digite um nome para a paleta!', 'accent'); return; }
  const customs = loadCustomPalettes();
  customs.push({ id: Date.now(), name, colors: [...state.palette] });
  saveCustomPalettesToStorage(customs);
  document.getElementById('saveForm').classList.add('hidden');
  renderCustomPalettes();
  updateCustomCount();
  showToast(`Paleta "${name}" salva!`, 'success');
}

function onColorPickerChange(e) {
  const newColor = e.target.value;
  state.selectedColor = newColor;
  document.getElementById('hexInput').value = newColor;

  // Se estiver editando um swatch, atualiza ele em tempo real
  if (editingIndex >= 0 && editingIndex < state.palette.length) {
    state.palette[editingIndex] = newColor;
    renderPalette();
    savePaletteState();
    if (state.colMode === 'palette' || state.colMode === 'depth' || state.colMode === 'duotone') {
      applyColorization();
    }
  } else {
    renderPalette();
  }
  updateStatus();
}

export function initPalette() {
  // Color picker sync
  document.getElementById('colorPicker').addEventListener('input', onColorPickerChange);

  // Hex input sync
  document.getElementById('hexInput').addEventListener('input', e => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      state.selectedColor = val;
      document.getElementById('colorPicker').value = val;

      if (editingIndex >= 0 && editingIndex < state.palette.length) {
        state.palette[editingIndex] = val;
        savePaletteState();
        if (state.colMode === 'palette' || state.colMode === 'depth' || state.colMode === 'duotone') {
          applyColorization();
        }
      }
      renderPalette();
      updateStatus();
    }
  });

  document.getElementById('hexInput').addEventListener('blur', e => {
    e.target.value = state.selectedColor;
  });

  // Swatch actions: Edit
  document.getElementById('btnEditSwatch').addEventListener('click', () => {
    if (selectedIndex < 0 || selectedIndex >= state.palette.length) return;
    editingIndex = selectedIndex;
    const col = state.palette[selectedIndex];
    syncColorInputs(col);
    // Abre o color picker nativo (funciona bem no mobile)
    document.getElementById('colorPicker').click();
    showToast('Escolha a nova cor', 'info', 1500);
  });

  // Swatch actions: Remove
  document.getElementById('btnRemoveSwatch').addEventListener('click', () => {
    if (selectedIndex < 0 || selectedIndex >= state.palette.length) return;
    removeSwatch(selectedIndex);
  });

  // Quando o color picker fecha, sair do modo edição
  document.getElementById('colorPicker').addEventListener('change', () => {
    editingIndex = -1;
  });

  // Add color
  document.getElementById('btnAddColor').addEventListener('click', () => {
    editingIndex = -1;
    const col = state.selectedColor;
    if (!state.palette.map(norm).includes(norm(col))) {
      state.palette.push(col);
      selectedIndex = state.palette.length - 1;
      showToast(`Cor ${col} adicionada!`, 'success');
    } else {
      showToast('Essa cor já está na paleta', 'info');
    }
    renderPalette();
    updateStatus();
    savePaletteState();
    if (state.colMode === 'palette' || state.colMode === 'depth' || state.colMode === 'duotone') {
      applyColorization();
    }
  });

  // Clear palette
  document.getElementById('btnClearPalette').addEventListener('click', () => {
    if (!state.palette.length) return;
    state.palette = [];
    selectedIndex = -1;
    editingIndex = -1;
    state.selectedColor = '#ffffff';
    syncColorInputs(state.selectedColor);
    renderPalette();
    updateStatus();
    savePaletteState();
    showToast('Paleta limpa!', 'info');
  });

  // Random palette
  document.getElementById('btnRandomPalette').addEventListener('click', () => {
    editingIndex = -1;
    state.palette = generateRandomPalette();
    selectedIndex = 0;
    state.selectedColor = state.palette[0];
    syncColorInputs(state.selectedColor);
    renderPalette();
    updateStatus();
    savePaletteState();
    if (state.colMode === 'palette' || state.colMode === 'depth' || state.colMode === 'duotone') {
      applyColorization();
    }
    showToast('🎲 Paleta aleatória!', 'success');
  });

  // Save palette form
  document.getElementById('btnSavePalette').addEventListener('click', () => {
    if (!state.palette.length) { showToast('Adicione cores antes de salvar!', 'accent'); return; }
    document.getElementById('saveForm').classList.remove('hidden');
    const input = document.getElementById('saveName');
    input.value = '';
    input.focus();
  });

  document.getElementById('btnConfirmSave').addEventListener('click', doSavePalette);
  document.getElementById('saveName').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSavePalette();
    if (e.key === 'Escape') document.getElementById('saveForm').classList.add('hidden');
  });
  document.getElementById('btnCancelSave').addEventListener('click', () => {
    document.getElementById('saveForm').classList.add('hidden');
  });

  // Palette tabs
  document.querySelectorAll('.palette-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.palette-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('presetsArea').classList.toggle('hidden', target !== 'presets');
      document.getElementById('customArea').classList.toggle('hidden', target !== 'custom');
    });
  });

  // Set initial selection
  if (state.palette.length) {
    selectedIndex = 0;
    state.selectedColor = state.palette[0];
  }

  // Render
  renderPalette();
  renderPresetPalettes();
  renderCustomPalettes();
  updateCustomCount();
}