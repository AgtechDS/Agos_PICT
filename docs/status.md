# Stato del Progetto — AGOS Pict Studio

> **Data Stato:** 05 Settembre 2026 — Ore 12:00 CET  
> **Versione Attuale:** `v2.5.0` (Leonardo.AI Studio Workspace Edition)  
> **Server Daemon:** `task-1508` attivo su `http://127.0.0.1:8300`  
> **Branch / Ambiente:** Main Local Workspace (`e:\Agtechdesigne\Progetti\IMAGE_APP`)

---

## 1. Stato Operativo dei Moduli di Sistema

| Componente | Stato | Dettagli & Prestazioni |
|---|---|---|
| **Server Backend (`server.py`)** | 🟢 **OPERATIVO** | Multithreaded `ThreadingHTTPServer`, zero crash, logging attivo, risposte HTTP 200 su tutti gli endpoint statici e API. |
| **Router Modelli AI (`image_router.py`)** | 🟢 **OPERATIVO** | Pollinations e HuggingFace rimossi. Smart Router Qwen + Agnes e Gemini Flash diretto. |
| **Google Gemini 3.1 Flash Pro** | 🟢 **OPERATIVO** | `gemini-3.1-flash-image-preview` / `gemini-2.5-flash`. Testi nitidi, fotorealismo e character consistency a 50 crediti. |
| **Agnes Background & Texture Studio** | 🟢 **OPERATIVO** | `agnes-image-2.5-flash` riconvertito a **100% Free (0 crediti)** per texture canvas pulite (negative prompt anti-testo/anti-volti). |
| **Smart Router (Free)** | 🟢 **OPERATIVO** | Auto-router ultra-reattivo tra Qwen Image Max e Agnes Background Studio (0 crediti, zero latenza sprecata). |
| **Engine Aspect Ratio ("MIT-Grade")** | 🟢 **OPERATIVO** | Ritaglio geometrico analitico su disco (`enforce_aspect_ratio` via Pillow). 8/8 formati testati con errore < 0.05%. |
| **Storage Immagini su Disco** | 🟢 **OPERATIVO** | Salvataggio permanente in `static/outputs/` con UUID univoci e serving `/outputs/<file>`. |
| **Repository Stili (31)** | 🟢 **OPERATIVO** | `static/styles.json` integrato con card e anteprime reali da PosterLab, ricerca live e filtro per categorie. |
| **Leonardo.AI Studio UI/UX** | 🟢 **OPERATIVO** | Prompt Bar in alto con auto-espansione dinamica, Box Canva espositivo in basso a pieno formato con metadati, sidebar sinistra con tessere Aspect Ratio proporzionali e pixel target, cassetto destro per i 31 stili con maniglia sul bordo. |
| **Sistema Crediti Client** | 🟢 **OPERATIVO** | 150 crediti bonus iniziali, detrazione corretta per Gemini (50c), modale di ricarica con animazione a impulsi. |
| **Conformità Purple Ban** | 🟢 **OPERATIVO** | Zero colori viola, magenta o indaco nel codice CSS. Palette basata su terracotta (`#e05638`), ocra dorata (`#e5a823`), blu ultramarine (`#0099cc`), verde smeraldo (`#00e599`) e ardesia scura. |

---

## 2. Ultime Modifiche Implementate (Changelog Recente)

1. **Riprogettazione Totale UI/UX Studio (Layout Ispirato a Leonardo.AI):**
   - **Prompt Bar in Alto ad Auto-Espansione:** Spostata la barra del prompt in cima all'area di creazione (`#promptInput`), con auto-resize dinamico della textarea che si adatta fluidamente alla lunghezza del testo, supporto Image-to-Image con chip thumbnail, pulsante diretto `[ 🎨 Stili 31 ]` e pulsante `✦ Genera` con gradiente terracotta/ambra.
   - **Box Canva Espositivo in Basso (Featured Canvas Card):** Ogni generazione viene presentata in una grande scheda studio: colonna sinistra con l'immagine in aspect-ratio esatto (MIT-grade), zoom lightbox e download rapido al passaggio del mouse; colonna destra con prompt integrale (tasto copia negli appunti), badge modello, risoluzione in pixel (`1024×1024 px`), ratio e pulsanti di esportazione verso PosterLab Pro o rigenerazione/variazione prompt.
   - **Sidebar Sinistra Controlli Studio:** Integrato selettore a tessere grafiche per le dimensioni (`1:1`, `9:16`, `4:5`, `16:9`, `2:3`, `3:4`, `3:2`, `21:9`) con aggiornamento dinamico dei pixel target, controllo qualità segmentato a 3 stati e pulsante "Reset to Defaults".
   - **Cassetto Destro Stili (31):** Accessibile sia dal pulsante nella barra del prompt che dalla maniglia interattiva sul bordo destro `"🎨 STILI ▶"`.
2. **Dismissione Definitiva Hugging Face Serverless (HTTP 410 Gone) & Rimozione FLUX:**
   - A seguito della disattivazione ufficiale delle API Serverless gratuite da parte di Hugging Face (ritorno errore 410), eliminato completamente FLUX.1 e il metodo `call_huggingface` da `image_router.py`.
   - Rimossa la dipendenza da `HF_TOKEN` e azzerato il tempo di fallback: lo Smart Router punta ora immediatamente a Qwen Image Max con paracadute su Agnes Studio con zero latenza persa.
   - Rimossi selettori, etichette UI, descrizioni nei crediti e metadati frontend in `index.html` e `app.js`.
2. **Ottimizzazione Mobile Apple iOS & Android:**
   - Creazione del Model Pill (`#modelPillBtn`) e del Settings Icon (`#settingsBtn`), eliminando l'affollamento dei select su 4 righe.
   - Implementazione di due **Bottom Sheets** con stile nativo mobile per la scelta dei modelli e delle impostazioni geometriche.
   - Eliminazione della maniglia laterale destra `.right-sidebar-toggle-handle` sui dispositivi mobili per evitare sovrapposizioni sui messaggi di chat.
   - Introduzione del pulsante dedicato `[ 🎨 Stili 31 ]` nella barra inferiore del composer.
   - Pieno supporto a `100dvh`, Safe Area Insets (`env(safe-area-inset-bottom)`) e prevenzione zoom forzato Safari.
3. **Riconversione Strategica Agnes AI:**
   - Modello stabilizzato come generatore di sfondi e texture astratte (0 crediti, negativo per escludere testi e visi), con pulsante per esportazione verso PosterLab Pro.
4. **Validazione Matematica Aspect Ratio Engine:**
   - Creato ed eseguito `test_ratios.py` con superamento 8/8 a tolleranza analitica < 0.05%.
5. **Fix Conflitto Modali Crediti & Hand-off:**
   - Disaccoppiamento dal flexbox genitore, posizionamento fixed a z-index assoluto e rimozione di `!important` dal selettore di base.
6. **Launcher One-Click Automatico (`start_project.bat` / `start.bat`):**
   - Script di avvio completo con verifica automatica dell'ambiente Python e installazione dinamica di Pillow.
   - Liberazione automatica della porta 8300 in caso di processi zombie precedenti per prevenire `WinError 10048`.
   - Apertura automatica del browser predefinito su `http://127.0.0.1:8300` non appena il server è operativo via `open_browser.py`.
   - Streaming a console in tempo reale dei log di generazione, ratio crop e richieste HTTP.

---

## 3. Piano Operativo per Domani (Sprint Backlog)

L'obiettivo di domani è trasformare AGOS Pict in una piattaforma **multi-utente con persistenza cloud, community e monetizzazione crediti**.

### Fase 1: Setup Supabase (Auth Google, Database & RLS)
- [ ] Creazione credenziali Supabase Auth con Google OAuth Provider.
- [ ] Implementazione schema PostgreSQL:
  - Tabella `profiles`: ID utente, email, username, avatar, saldo crediti persistente su cloud (default 150).
  - Tabella `showcase_posts`: Vetrina creativa pubblica con `image_url`, `prompt`, `style_id`, `aspect_ratio`, `likes_count`.
- [ ] Configurazione policy Row-Level Security (RLS) per proteggere le modifiche al saldo e consentire la lettura pubblica della vetrina.

### Fase 2: Profilo Utente & Vetrina Creativa nel Frontend
- [ ] Sostituzione badge crediti generico nell'header con:
  - Bottone Login con Google (se non autenticato).
  - Avatar utente con menu a discesa (Profilo, Crediti, I miei Concept, Logout).
- [ ] Aggiunta tab / cassetto "Vetrina Creativa (Community Showcase)":
  - Feed a griglia asimmetrica delle immagini pubblicate dagli utenti.
  - Tasto "+ Pubblica in Vetrina" su ogni immagine generata nella chat.
  - Sistema di Like con animazione micro-interattiva.

### Fase 3: Gateway Pagamenti Stripe (Ricarica Crediti)
- [ ] Configurazione Stripe API Key e pacchetti crediti:
  - *Starter Pack:* 500 crediti (€4.99)
  - *Creator Pack:* 1500 crediti (€12.99)
  - *Studio Pro:* 5000 crediti (€34.99)
- [ ] Endpoint backend `POST /api/stripe/create-checkout-session` per generare la sessione di pagamento Stripe Checkout.
- [ ] Endpoint backend `POST /api/stripe/webhook` con verifica crittografica della firma Stripe:
  - All'evento `checkout.session.completed`, accredito atomico dei crediti acquistati sul profilo Supabase dell'utente.

---

## 4. Linee Guida e Vincoli Architetturali da Mantenere

* **Prompt Defense & Secrets Isolation:** Nessuna chiave privata o chiave di servizio Supabase (`service_role`) deve trapelare sul frontend. Solo chiavi anonime pubbliche sul client; operazioni critiche su `server.py`.
* **Zero Purple Tolerance (Purple Ban):** Mantenere l'identità visiva distintiva AGOS senza mai cedere a palette viola o gradienti magenta cliché.
* **Mobile-First & Performance:** Qualsiasi nuova interfaccia (Vetrina o Profilo) dovrà rispettare i requisiti touch Apple/Android (bottom sheets, min-height 44px, smooth scroll 60fps).
