<div align="center">

# agtechdesigne STUDIO
### AI Creative Visual Playground & Style Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-5D2EFF.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-00E7FF.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Zero Dependency Core](https://img.shields.io/badge/Core-Zero%20Dependency-D4A017.svg?style=for-the-badge)](server.py)
[![Design System](https://img.shields.io/badge/Style-Tokyo%20Cyber%20%7C%20Gemini%20Aesthetic-FF1E9E.svg?style=for-the-badge)](docs/AGOS_VISUAL_DESIGN_SYSTEM.md)

<p align="center">
  <strong>agtechdesigne Studio (AGOS Pict)</strong> is a state-of-the-art AI-powered visual playground, concept art generator, and poster ideation studio. Built with a resilient multi-provider neural router, precision aspect-ratio cropping, and an electric cyber-cinematic user interface.
</p>

[Caratteristiche](#-caratteristiche-principali) •
[Architettura](#-architettura-del-sistema) •
[Quickstart Locale](#-quickstart-in-locale) •
[Deploy su Vercel](#-deploy-su-vercel) •
[Variabili d'Ambiente](#-variabili-dambiente) •
[API Reference](#-api-reference) •
[Licenza](#-licenza)

</div>

---

## ✦ Caratteristiche Principali

- **🔀 Smart Router Neurale Multi-Provider**:
  - **Tier 1 (Free Primary)**: *Qwen Image Max 2025* (LLMAPI) per illustrazioni e concept poster ad alta fedeltà.
  - **Tier 2 (Free Fallback)**: *Agnes AI Hub Background Studio* (`agnes-image-2.5-flash`) specializzato in sfondi grafici, wallpaper e texture astratte senza testo, pronti come canvas per PosterLab.
  - **Tier Pro (50 Crediti)**: *Google Gemini 3.1 Flash Image* (AI Studio Direct) per fotorealismo Ultra-HD e character consistency.
  - **Circuit Breaker**: Gestione dinamica dei rate limit (HTTP 429) e timeout con auto-switch istantaneo al provider secondario.

- **📐 Precision Aspect-Ratio Engine (MIT-Grade)**:
  - Supporto nativo per tutti gli 8 formati grafici industriali: `1:1`, `9:16`, `16:9`, `4:5`, `3:4`, `2:3`, `3:2`, `21:9`.
  - Motore di calibrazione geometrica con tolleranza analitica `< 1.5%` e center-crop simmetrico su Pillow per evitare qualsiasi distorsione o allungamento.

- **🎨 Official agtechdesigne Visual Design System**:
  - Gerarchia cromatica rigorosa 60-25-10-5: **Midnight Void** (`#050507`), **Universe Blue Violet** (`#5D2EFF`), **Cyan Soft Glow** (`#00E7FF`), **Royal Gold** (`#D4A017`), e accento dinamico **Neon Fuchsia** (`#FF1E9E`).
  - Micro-animazioni eteree (*levitazione magnetica*, *spectral glow*, *dynamic vessels*, scrollbar minimali).

- **⚡ Doppio Runtime (Local + Vercel Serverless)**:
  - Server di sviluppo zero-dipendenze (`server.py` basato su standard library `http.server`).
  - Serverless Function entrypoint nativa (`api/index.py` + `vercel.json`) con supporto all'ambiente read-only di AWS Lambda / Vercel.

---

## 🏛 Architettura del Sistema

```text
Agos_PICT/
├── .env.example              # Template variabili d'ambiente con documentazione
├── .gitignore                # Regole restrittive (sicurezza credenziali & cache)
├── LICENSE                   # Licenza Open Source MIT
├── README.md                 # Documentazione tecnica e manuale d'uso
├── requirements.txt          # Dipendenze Python (Pillow>=10.0.0)
├── vercel.json               # Configurazione routing rewrites & security headers Vercel
├── server.py                 # Server HTTP locale zero-dipendenze (porta 8300)
├── image_router.py           # Core neural multi-provider router & aspect ratio engine
├── api/
│   └── index.py              # Serverless Function entrypoint per Vercel
├── static/                   # Frontend SPA ad alte prestazioni
│   ├── index.html            # Markup semantico Leonardo-inspired studio layout
│   ├── style.css             # Foglio di stile principale agtechdesigne
│   ├── agos-design-tokens.css# Token e variabili CSS riutilizzabili cross-project
│   ├── app.js                # State machine frontend, auto-resize e streaming canvas
│   ├── styles.json           # Catalogo 32 stili visivi curati
│   ├── site.webmanifest      # PWA Manifest
│   ├── favicon.ico           # Favicon ufficiale AgTechDesigne
│   └── style_previews/       # Showcase anteprime stili reali in alta definizione
├── docs/                     # Documentazione architetturale di riferimento
│   ├── architettura.md
│   ├── status.md
│   ├── AGOS_VISUAL_DESIGN_SYSTEM.md
│   ├── PaletteUfficiale/
│   └── favicon_io/
├── scripts/                  # Utility operative
│   ├── open_browser.py       # Helper apertura automatica browser
│   ├── set_key.py            # CLI configurazione credenziali
│   └── start_server.py
└── tests/                    # Test suite automatizzata
    ├── test_router.py        # Validazione multi-provider
    ├── test_ratios.py        # Validazione geometrica aspect ratio
    └── test_generate.py      # Test end-to-end generazione
```

---

## 🚀 Quickstart in Locale

### Prerequisiti
- **Python 3.10** o superiore
- Connessione a Internet per le chiamate ai modelli neurali

### 1. Clona il repository e prepara l'ambiente
```bash
git clone https://github.com/AgtechDS/Agos_PICT.git
cd Agos_PICT
pip install -r requirements.txt
```

### 2. Configura le chiavi API
Copia il template delle variabili d'ambiente:
```bash
cp .env.example .env
```
Modifica `.env` inserendo almeno una delle seguenti chiavi:
- `LLMAPI_API_KEY`: per Qwen Image Max (free)
- `GEMINI_API_KEY`: per Google Gemini 3.1 Flash (Ultra-HD)
- `AGNESAI_API_KEY`: per Agnes Background Studio (free)

### 3. Avvia l'applicazione
Su Windows, puoi fare doppio clic su `start.bat` oppure eseguire:
```bash
python server.py
```
L'applicazione sarà immediatamente disponibile su **`http://127.0.0.1:8300`**.

---

## ☁️ Deploy su Vercel

Il repository è configurato per il deployment istantaneo su **Vercel** tramite Serverless Functions in Python:

1. Fai il push del progetto su GitHub (es. `https://github.com/AgtechDS/Agos_PICT.git`).
2. Accedi a [Vercel Dashboard](https://vercel.com/new) e importa il repository `Agos_PICT`.
3. In **Project Settings** -> **Environment Variables**, configura le tue chiavi:
   - `LLMAPI_API_KEY`
   - `LLMAPI_IMAGE_MODEL` = `qwen-image-max-2025-12-30`
   - `GEMINI_API_KEY` (opzionale)
   - `AGNESAI_API_KEY` (opzionale)
4. Clicca su **Deploy**. Vercel compilerà automaticamente il runtime Python e distribuirà gli asset statici su CDN globale.

---

## 🔑 Variabili d'Ambiente

| Variabile | Descrizione | Default / Note |
|---|---|---|
| `LLMAPI_BASE_URL` | Endpoint base per LLMAPI | `https://api.llmapi.ai/v1` |
| `LLMAPI_API_KEY` | Chiave API principale LLMAPI | Richiesta per Qwen Image Max |
| `LLMAPI_IMAGE_MODEL` | Modello predefinito LLMAPI | `qwen-image-max-2025-12-30` |
| `GEMINI_API_KEY` | Google AI Studio Direct API Key | Modello Ultra-HD con typography |
| `AGNESAI_API_KEY` | Agnes AI Hub API Key | Modello Sfondi & Texture grafiche |
| `AGNESAI_BASE_URL` | Endpoint Agnes AI Hub | `https://apihub.agnes-ai.com/v1` |
| `PORT` | Porta server di sviluppo locale | `8300` |

---

## 📡 API Reference

### `POST /api/generate`
Genera un'immagine con routing automatico o provider specifico.

**Request Body (JSON):**
```json
{
  "prompt": "Cyberpunk tokyo neon alley, rain reflections, high contrast",
  "quality": "auto",
  "ratio": "16:9",
  "model": "auto-router",
  "width": 1280,
  "height": 720
}
```

**Response (JSON):**
```json
{
  "ok": true,
  "image_url": "https://...",
  "provider": "Qwen Image Max (LLMAPI)",
  "model": "qwen-image-max-2025-12-30",
  "meta": {
    "ratio": "16:9",
    "size": "1280x720",
    "aspect_ratio": 1.7778
  }
}
```

### `GET /status`
Verifica lo stato delle chiavi API, del router e dei modelli disponibili.

### `GET /models`
Restituisce l'elenco dei modelli disponibili con costi in crediti e descrizioni.

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Consulta il file [LICENSE](LICENSE) per ulteriori informazioni.

Copyright © 2026 **AgTechDesigne**. All rights reserved.
