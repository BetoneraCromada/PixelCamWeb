<p align="center">
  <br>
  <strong style="font-size:2em">PIXEL<em>CAM</em></strong>
  <br>
  <em>0.03 megapixel experience</em>
  <br><br>
  <a href="https://betonercromada.github.io/PixelCamWeb/">Abrir o App</a>
</p>

---

Transforme qualquer foto ou camera ao vivo em pixel art diretamente no navegador. Sem instalacao, sem backend, sem dependencias. Funciona no celular e no desktop.

## Preview

| Camera ao vivo | Editor de pixels |
|:-:|:-:|
| Visualizacao pixelada em tempo real | Pinte, preencha e apague pixel por pixel |

## Funcionalidades

**Camera**
- Camera ao vivo com preview pixelado em tempo real
- Alternar entre camera frontal e traseira
- Espelhamento, zoom (1x-5x), brilho e contraste
- Timer (3s, 5s, 10s) e efeito flash
- Upload de imagem da galeria (JPG, PNG, WEBP)

**Editor**
- Ferramentas: pincel, balde de tinta e borracha
- 5 modos de colorizacao: original, paleta, profundidade, duotone e escala de cinza
- Undo/redo ilimitado

**Paletas**
- 12 paletas prontas com 6 cores cada (organizadas escuro para claro)
- Criar, editar e salvar paletas personalizadas (salvas no navegador)
- Geracao aleatoria inteligente: gradientes lineares escuro-para-claro na maioria das vezes
- Gerenciamento touch-friendly no celular (barra de acoes por swatch)

**Formato e Resolucao**
- 6 aspect ratios: 4:3, 16:9, 9:16, 1:1, 3:2, 2:3
- 10 resolucoes de 8px (ATOM) ate 320px
- Redimensionamento com opcao de corte ou esticamento

**Exportar**
- Download em PNG
- Copiar para area de transferencia
- Compartilhar via Web Share API
- Marca d'agua opcional

## Atalhos de teclado

| Tecla | Acao |
|-------|------|
| `1` | Pincel |
| `2` | Balde |
| `3` | Borracha |
| `Space` | Capturar foto |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| `Ctrl+S` | Baixar PNG |

## Estrutura do projeto

```
PixelCam/
├── index.html              # HTML principal
├── css/
│   ├── base.css            # Variaveis, reset, layout
│   ├── components.css      # Botoes, sliders, toggles
│   ├── camera.css          # Viewfinder, controles de camera
│   ├── editor.css          # Canvas, ferramentas, colorizacao
│   ├── palette.css         # Paletas, swatches, acoes
│   └── modal.css           # Modais, toasts, exportacao
└── js/
    ├── main.js             # Entry point (ES modules)
    ├── state.js            # Estado global e refs do DOM
    ├── camera.js           # Camera, preview, captura, upload
    ├── editor.js           # Renderizacao, pintura, colorizacao
    ├── palette.js          # Paletas, presets, geracao aleatoria
    ├── resize.js           # Aspect ratio, resolucao, modal
    ├── export.js           # Download, copiar, compartilhar
    ├── shortcuts.js        # Atalhos de teclado
    └── utils/
        ├── color.js        # Conversao de cores (hex, rgb, hsl)
        └── toast.js        # Notificacoes toast
```

## Tecnologias

- **Vanilla JS** com ES Modules (zero dependencias)
- **Canvas API** para renderizacao e manipulacao de pixels
- **MediaDevices API** para acesso a camera
- **Web Share API** para compartilhamento nativo
- **LocalStorage** para persistencia de paletas
- **CSS Custom Properties** para tema escuro

## Como rodar localmente

O projeto usa ES Modules, entao precisa de um servidor HTTP:

```bash
# Qualquer uma dessas opcoes:
python3 -m http.server 8000
npx serve .
php -S localhost:8000
```

Abra `http://localhost:8000` no navegador.

> A camera requer **HTTPS** em dispositivos moveis. Para testar no celular, use GitHub Pages ou um tunel como `npx ngrok http 8000`.

## Autor

**Gabriel Pereira**

---

<p align="center">
  <sub>Feito com Canvas API e muito cafe</sub>
</p>
