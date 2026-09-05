/* ===== AGOS_PICT STUDIO — APP JS (GIOVANILE & MULTI-PROVIDER) ===== */
(() => {
  'use strict';

  // DOM refs
  const $ = (id) => document.getElementById(id);
  const messagesEl = $('messages');
  const welcomeEl = $('welcomeMsg');
  const promptInput = $('promptInput');
  const sendBtn = $('sendBtn');
  const chatList = $('chatList');
  const chatTitle = $('chatTitle');
  const statusDot = $('statusDot');
  const statusText = $('statusText');
  const modelSelect = $('modelSelect');
  const ratioSelect = $('ratioSelect');
  const qualitySelect = $('qualitySelect');
  const clearBtn = $('clearBtn');
  const newChatBtn = $('newChatBtn');
  const menuBtn = $('menuBtn');
  const useSpecimenBtn = $('useSpecimenBtn');

  // Attachment refs
  const attachBtn = $('attachBtn');
  const imageInput = $('imageInput');
  const imagePreviewCard = $('imagePreviewCard');
  const previewThumb = $('previewThumb');
  const previewFilename = $('previewFilename');
  const removeImageBtn = $('removeImageBtn');
  const dragOverlay = $('dragOverlay');

  // Layout & Left Sidebar refs
  const appRoot = $('appRoot');
  const sidebar = $('sidebar');
  const toggleLeftSidebarBtn = $('toggleLeftSidebarBtn');
  const closeLeftSidebarBtn = $('closeLeftSidebarBtn');
  const leftHandleArrow = $('leftHandleArrow');
  const sidebarOverlay = $('sidebarOverlay');

  // Pre-Prompt Styles & Right Sidebar refs (Unico punto di accesso agli stili)
  const rightSidebar = $('rightSidebar');
  const toggleRightSidebarBtn = $('toggleRightSidebarBtn');
  const handleArrow = $('handleArrow');
  const closeRightSidebarBtn = $('closeRightSidebarBtn');
  const rightSidebarOverlay = $('rightSidebarOverlay');
  const composerBox = $('composerBox');
  const styleSearchInput = $('styleSearchInput');
  const styleCategories = $('styleCategories');
  const stylesGrid = $('stylesGrid');
  const activeStylePill = $('activeStylePill');
  const activeStyleName = $('activeStyleName');
  const activeStyleRgbDots = $('activeStyleRgbDots');
  const clearActiveStyleBtn = $('clearActiveStyleBtn');

  // Active Style RGB Mix Banner refs
  const activeStyleBanner = $('activeStyleBanner');
  const bannerColorStrip = $('bannerColorStrip');
  const bannerStyleName = $('bannerStyleName');
  const bannerRgbMix = $('bannerRgbMix');
  const bannerClearBtn = $('bannerClearBtn');

  // PosterLab Pro Handoff refs
  const handoffModal = $('handoffModal');
  const closeHandoffBtn = $('closeHandoffBtn');
  const closeHandoffOkBtn = $('closeHandoffOkBtn');
  const copyConceptPromptBtn = $('copyConceptPromptBtn');

  // Credits System refs (150 free, 50 gemini flash, 30 agnes)
  const creditsBadge = $('creditsBadge');
  const creditsAmount = $('creditsAmount');
  const creditsModal = $('creditsModal');
  const closeCreditsBtn = $('closeCreditsBtn');
  const closeCreditsOkBtn = $('closeCreditsOkBtn');
  const refillCreditsBtn = $('refillCreditsBtn');
  const modalCreditsNum = $('modalCreditsNum');
  const modelCostPill = $('modelCostPill');
  const modelCostText = $('modelCostText');

  // Mobile & Streamlined Composer Toolbar refs
  const modelPillBtn = $('modelPillBtn');
  const modelPillIcon = $('modelPillIcon');
  const modelPillName = $('modelPillName');
  const settingsBtn = $('settingsBtn');
  const ratioSummaryPill = $('ratioSummaryPill');
  const stylesToolBtn = $('stylesToolBtn');

  // Leonardo Studio Workspace refs
  const headerStiliBtn = $('headerStiliBtn');
  const sidebarOpenStylesBtn = $('sidebarOpenStylesBtn');
  const ratioTilesGrid = $('ratioTilesGrid');
  const pixelDimensionsBadge = $('pixelDimensionsBadge');
  const qualitySegmented = $('qualitySegmented');
  const resetDefaultsBtn = $('resetDefaultsBtn');
  const clearActiveStylePillBtn = $('clearActiveStylePillBtn');
  const activeStyleTagText = $('activeStyleTagText');

  const PIXEL_LABELS = {
    "1:1": "1024 × 1024 px",
    "9:16": "720 × 1280 px",
    "4:5": "864 × 1080 px",
    "16:9": "1280 × 720 px",
    "2:3": "720 × 1080 px",
    "3:4": "768 × 1024 px",
    "3:2": "1080 × 720 px",
    "21:9": "1344 × 576 px"
  };

  function selectRatio(ratio) {
    if (ratioSelect) ratioSelect.value = ratio;
    if (pixelDimensionsBadge) pixelDimensionsBadge.textContent = PIXEL_LABELS[ratio] || (ratio + " px");
    if (ratioTilesGrid) {
      ratioTilesGrid.querySelectorAll('.ratio-tile').forEach(t => {
        t.classList.toggle('active', t.dataset.ratio === ratio);
      });
    }
    if (ratioSummaryPill) ratioSummaryPill.textContent = ratio;
    if (ratioOptionsGrid) {
      ratioOptionsGrid.querySelectorAll('.ratio-chip-opt').forEach(b => {
        b.classList.toggle('active', b.dataset.ratio === ratio);
      });
    }
  }

  // Bottom Sheets refs
  const modelSheetBackdrop = $('modelSheetBackdrop');
  const closeModelSheetBtn = $('closeModelSheetBtn');
  const modelSheetList = $('modelSheetList');

  const settingsSheetBackdrop = $('settingsSheetBackdrop');
  const closeSettingsSheetBtn = $('closeSettingsSheetBtn');
  const ratioOptionsGrid = $('ratioOptionsGrid');
  const qualitySegmentControl = $('qualitySegmentControl');
  const applySettingsBtn = $('applySettingsBtn');

  const CREDITS_KEY = 'AGOS_PICT_user_credits_v1';
  const DEFAULT_CREDITS = 150;

  function getCredits() {
    const val = localStorage.getItem(CREDITS_KEY);
    if (val === null) {
      localStorage.setItem(CREDITS_KEY, DEFAULT_CREDITS.toString());
      return DEFAULT_CREDITS;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? DEFAULT_CREDITS : parsed;
  }

  function updateCreditsUI(animate = false) {
    const current = getCredits();
    if (creditsAmount) creditsAmount.textContent = current;
    if (modalCreditsNum) modalCreditsNum.textContent = current;
    const sidebarCreditsNum = document.getElementById('sidebarCreditsNum');
    if (sidebarCreditsNum) sidebarCreditsNum.textContent = current;
    if (animate && creditsBadge) {
      creditsBadge.classList.remove('credits-deduct-anim');
      void creditsBadge.offsetWidth;
      creditsBadge.classList.add('credits-deduct-anim');
    }
  }

  function deductCredits(amount) {
    const current = getCredits();
    const next = Math.max(0, current - amount);
    localStorage.setItem(CREDITS_KEY, next.toString());
    updateCreditsUI(true);
    return next;
  }

  function addCredits(amount) {
    const current = getCredits();
    const next = current + amount;
    localStorage.setItem(CREDITS_KEY, next.toString());
    updateCreditsUI(true);
    return next;
  }

  function getModelCreditCost(modelId) {
    if (modelId === 'gemini-2.5-flash' || modelId === 'gemini-flash' || modelId === 'gemini-3.1-flash-image-preview') return 50;
    // Agnes Image è ora specializzato come Background & Texture Studio: 100% Free (0 crediti)
    return 0;
  }

  function updateModelPillUI() {
    if (!modelSelect) return;
    const selected = modelSelect.value;
    const cost = getModelCreditCost(selected);

    let icon = '🔀';
    let displayName = 'Smart Router';
    if (selected === 'gemini-3.1-flash-image-preview' || selected.includes('gemini')) {
      icon = '⚡';
      displayName = 'Gemini 3.1 Flash';
    } else if (selected.includes('agnes')) {
      icon = '🎨';
      displayName = 'Agnes Background';
    } else if (selected.includes('qwen')) {
      icon = '🎨';
      displayName = 'Qwen Image Max';
    }

    if (modelPillIcon) modelPillIcon.textContent = icon;
    if (modelPillName) modelPillName.textContent = displayName;

    if (modelCostText && modelCostPill) {
      if (cost === 0) {
        modelCostText.textContent = 'Free';
        modelCostPill.className = 'model-cost-pill free';
      } else {
        modelCostText.textContent = `${cost}c`;
        modelCostPill.className = 'model-cost-pill pro';
      }
    }
  }

  function updateModelCostIndicator() {
    if (!modelSelect || !modelCostText || !modelCostPill) return;
    const selected = modelSelect.value;
    const cost = getModelCreditCost(selected);
    if (cost === 0) {
      modelCostText.textContent = '0 crediti (Free)';
      modelCostPill.className = 'model-cost-pill free';
    } else {
      modelCostText.textContent = `${cost} crediti`;
      modelCostPill.className = 'model-cost-pill pro';
    }
    updateModelPillUI();
  }

  const MODEL_META = {
    'auto-router': {
      icon: '🔀',
      name: 'Smart Router (Free)',
      sub: 'Multi-provider automatico (Qwen Image Max, Agnes Studio)',
      badge: '0 crediti (Free)',
      isFree: true
    },
    'smart_router': {
      icon: '🔀',
      name: 'Smart Router (Free)',
      sub: 'Multi-provider automatico (Qwen Image Max, Agnes Studio)',
      badge: '0 crediti (Free)',
      isFree: true
    },
    'gemini-2.5-flash': {
      icon: '⚡',
      name: 'Google Gemini 3.1 Flash Pro',
      sub: 'Ultra-HD rendering fotorealistico con perfetta resa tipografica',
      badge: '50 crediti',
      isFree: false
    },
    'gemini-3.1-flash-image-preview': {
      icon: '⚡',
      name: 'Google Gemini 3.1 Flash Pro',
      sub: 'Ultra-HD rendering fotorealistico con perfetta resa tipografica',
      badge: '50 crediti',
      isFree: false
    },
    'agnes-image-2.5-flash': {
      icon: '🎨',
      name: 'Agnes Background Studio',
      sub: 'Sfondi grafici, texture materiche & canvas per PosterLab',
      badge: '0 crediti (Free)',
      isFree: true
    },
    'agnes_image': {
      icon: '🎨',
      name: 'Agnes Background Studio',
      sub: 'Sfondi grafici, texture materiche & canvas per PosterLab',
      badge: '0 crediti (Free)',
      isFree: true
    },
    'qwen-image-max-2025-12-30': {
      icon: '🎨',
      name: 'Qwen Image Max',
      sub: 'Dettagli grafici ad alto contrasto per poster e illustrazioni',
      badge: '0 crediti (Free)',
      isFree: true
    },
    'qwen_image': {
      icon: '🎨',
      name: 'Qwen Image Max',
      sub: 'Dettagli grafici ad alto contrasto per poster e illustrazioni',
      badge: '0 crediti (Free)',
      isFree: true
    }
  };

  function renderModelSheet(modelsList) {
    if (!modelSheetList) return;
    modelSheetList.innerHTML = '';
    const currentVal = modelSelect.value;

    modelsList.forEach(m => {
      const meta = MODEL_META[m.id] || {
        icon: '🔀',
        name: m.name || m.id,
        sub: 'Motore di generazione grafica AI',
        badge: getModelCreditCost(m.id) === 0 ? '0 crediti (Free)' : `${getModelCreditCost(m.id)} crediti`,
        isFree: getModelCreditCost(m.id) === 0
      };

      const card = document.createElement('div');
      card.className = 'model-option-card' + (m.id === currentVal ? ' selected' : '');
      card.innerHTML = `
        <div class="card-left">
          <div class="card-icon">${meta.icon}</div>
          <div class="card-texts">
            <span class="card-title">${meta.name}</span>
            <span class="card-sub">${meta.sub}</span>
          </div>
        </div>
        <div class="card-right">
          <span class="model-cost-pill ${meta.isFree ? 'free' : 'pro'}">${meta.badge}</span>
          <span class="card-radio">✓</span>
        </div>
      `;

      card.addEventListener('click', () => {
        modelSelect.value = m.id;
        updateModelCostIndicator();
        updateModelPillUI();
        renderModelSheet(modelsList);
        closeModelSheet();
      });

      modelSheetList.appendChild(card);
    });
  }

  function openModelSheet() {
    if (modelSheetBackdrop) {
      if (availableModels && availableModels.length) {
        const list = availableModels.map(id => ({ id, name: id }));
        renderModelSheet(list);
      }
      modelSheetBackdrop.classList.add('open');
      modelSheetBackdrop.style.display = 'flex';
    }
  }

  function closeModelSheet() {
    if (modelSheetBackdrop) {
      modelSheetBackdrop.classList.remove('open');
      modelSheetBackdrop.style.display = 'none';
    }
  }

  function openSettingsSheet() {
    if (settingsSheetBackdrop) {
      if (ratioOptionsGrid) {
        const curRatio = ratioSelect.value;
        ratioOptionsGrid.querySelectorAll('.ratio-chip-opt').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.ratio === curRatio);
        });
      }
      if (qualitySegmentControl) {
        const curQuality = qualitySelect.value;
        qualitySegmentControl.querySelectorAll('.quality-seg-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.quality === curQuality);
        });
      }
      settingsSheetBackdrop.classList.add('open');
      settingsSheetBackdrop.style.display = 'flex';
    }
  }

  function closeSettingsSheet() {
    if (settingsSheetBackdrop) {
      settingsSheetBackdrop.classList.remove('open');
      settingsSheetBackdrop.style.display = 'none';
    }
  }

  // State
  let chats = [];
  let activeChatId = null;
  let busy = false;
  let availableModels = [];
  let attachedImage = null; // { dataUrl, filename }
  let stylesData = [];
  let activeStyle = null;
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentHandoffPrompt = '';

  const MAX_TITLE_LEN = 40;
  const LS_KEY = 'AGOS_PICT_image_chats_v2';

  // ---------- Utils ----------
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function saveChats() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(chats));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  function loadChats() {
    try {
      const raw = localStorage.getItem(LS_KEY) || localStorage.getItem('agos_image_chats_v1');
      chats = raw ? JSON.parse(raw) : [];
    } catch (e) {
      chats = [];
    }
  }

  function getActiveChat() {
    return chats.find(c => c.id === activeChatId) || null;
  }

  function makeTitle(prompt) {
    const clean = prompt.replace(/\s+/g, ' ').trim();
    if (!clean) return 'Poster Session';
    return clean.length > MAX_TITLE_LEN ? clean.slice(0, MAX_TITLE_LEN) + '…' : clean;
  }

  // ---------- Attachment Handling ----------
  function setAttachedImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      attachedImage = {
        dataUrl: e.target.result,
        filename: file.name
      };
      previewThumb.src = attachedImage.dataUrl;
      previewFilename.textContent = file.name;
      imagePreviewCard.style.display = 'flex';
      attachBtn.classList.add('has-image');
      updateSendButton();
    };
    reader.readAsDataURL(file);
  }

  function clearAttachedImage() {
    attachedImage = null;
    imagePreviewCard.style.display = 'none';
    attachBtn.classList.remove('has-image');
    imageInput.value = '';
    updateSendButton();
  }

  // ---------- Drag & Drop Global ----------
  let dragCounter = 0;
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragOverlay) dragOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && dragOverlay) {
      dragOverlay.classList.remove('active');
      dragCounter = 0;
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dragOverlay) dragOverlay.classList.remove('active');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setAttachedImage(file);
      }
    }
  });

  attachBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedImage(e.target.files[0]);
    }
  });
  removeImageBtn.addEventListener('click', clearAttachedImage);

  // ---------- Render chat list ----------
  function renderChatList() {
    chatList.innerHTML = '';
    for (const chat of chats) {
      const item = document.createElement('div');
      item.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');

      const name = document.createElement('span');
      name.className = 'chat-name';
      name.textContent = chat.title || 'Nuova Sessione';

      const del = document.createElement('button');
      del.className = 'chat-delete';
      del.textContent = '✕';
      del.title = 'Elimina sessione';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Eliminare questa sessione?')) {
          chats = chats.filter(c => c.id !== chat.id);
          if (activeChatId === chat.id) {
            activeChatId = chats.length ? chats[0].id : null;
          }
          saveChats();
          renderChatList();
          renderMessages();
        }
      });

      item.appendChild(name);
      item.appendChild(del);
      item.addEventListener('click', () => {
        activeChatId = chat.id;
        renderChatList();
        renderMessages();
      });
      chatList.appendChild(item);
    }
  }

  // ---------- Render Leonardo.AI Studio Canvas Cards ----------
  function createMediaCard(msg) {
    const card = document.createElement('div');
    card.className = 'canvas-card';

    const ratio = (msg.meta && msg.meta.ratio) || '1:1';
    const cssAspect = ratio.replace(':', '/');
    const size = (msg.meta && msg.meta.size) || (PIXEL_LABELS[ratio] ? PIXEL_LABELS[ratio].replace(' px', '') : '1024×1024');
    const provider = msg.provider || 'Smart Router (Free)';
    const promptText = msg.prompt || msg.text || 'Concept grafico sperimentale';
    const isBg = msg.meta && msg.meta.is_background;
    const isRef = msg.meta && msg.meta.reference_image;

    // Colonna Sinistra: Immagine con aspect ratio
    const imgCol = document.createElement('div');
    imgCol.className = 'canvas-card-image-col';

    const imgBox = document.createElement('div');
    imgBox.className = 'canvas-img-box';
    imgBox.style.aspectRatio = cssAspect;

    const img = document.createElement('img');
    img.src = msg.image;
    img.alt = promptText;
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(msg.image));

    const hoverOverlay = document.createElement('div');
    hoverOverlay.className = 'canvas-img-hover-overlay';

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'canvas-overlay-btn';
    zoomBtn.innerHTML = '🔍 Zoom HD';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(msg.image);
    });

    const dlBtnOverlay = document.createElement('button');
    dlBtnOverlay.className = 'canvas-overlay-btn';
    dlBtnOverlay.innerHTML = '⬇ Scarica';
    dlBtnOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadImage(msg.image, promptText);
    });

    hoverOverlay.appendChild(zoomBtn);
    hoverOverlay.appendChild(dlBtnOverlay);

    imgBox.appendChild(img);
    imgBox.appendChild(hoverOverlay);
    imgCol.appendChild(imgBox);

    // Colonna Destra: Metadati, Prompt e Azioni
    const infoCol = document.createElement('div');
    infoCol.className = 'canvas-card-info-col';

    const topWrap = document.createElement('div');
    topWrap.className = 'canvas-info-top';

    // Meta row
    const metaRow = document.createElement('div');
    metaRow.className = 'canvas-card-meta-row';
    metaRow.innerHTML = `
      <span class="canvas-date-badge">OGGI · CONCEPT POSTER</span>
      <span class="canvas-spec-badge model-tag">⚡ ${provider}</span>
    `;

    // Prompt box
    const promptBox = document.createElement('div');
    promptBox.className = 'canvas-prompt-box';

    const promptHeader = document.createElement('div');
    promptHeader.className = 'canvas-prompt-header';
    promptHeader.innerHTML = `
      <span class="canvas-prompt-label">PROMPT DI GENERAZIONE</span>
    `;
    const copyPromptBtn = document.createElement('button');
    copyPromptBtn.className = 'canvas-copy-prompt-btn';
    copyPromptBtn.innerHTML = '📋 Copia';
    copyPromptBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(promptText);
      copyPromptBtn.innerHTML = '✓ Copiato!';
      setTimeout(() => copyPromptBtn.innerHTML = '📋 Copia', 1800);
    });
    promptHeader.appendChild(copyPromptBtn);

    const promptP = document.createElement('p');
    promptP.className = 'canvas-prompt-text';
    promptP.textContent = promptText;

    promptBox.appendChild(promptHeader);
    promptBox.appendChild(promptP);

    // Specs row
    const specsRow = document.createElement('div');
    specsRow.className = 'canvas-specs-row';
    specsRow.innerHTML = `
      <span class="canvas-spec-badge ratio-tag">📐 Formato: ${ratio}</span>
      <span class="canvas-spec-badge">📏 Risoluzione: ${size}</span>
      ${isBg ? '<span class="canvas-spec-badge bg-tag">🎨 Sfondo Canvas (No Testi)</span>' : ''}
      ${isRef ? '<span class="canvas-spec-badge">🖼️ Guidato da Riferimento</span>' : ''}
    `;

    topWrap.appendChild(metaRow);
    topWrap.appendChild(promptBox);
    topWrap.appendChild(specsRow);

    // Actions row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'canvas-actions-row';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'canvas-action-primary';
    dlBtn.innerHTML = '⬇ Scarica Immagine HD';
    dlBtn.addEventListener('click', () => downloadImage(msg.image, promptText));
    actionsRow.appendChild(dlBtn);

    const handoffBtn = document.createElement('button');
    handoffBtn.className = 'canvas-action-secondary';
    if (isBg) {
      handoffBtn.innerHTML = '🪄 Usa come Sfondo in PosterLab Pro';
      handoffBtn.addEventListener('click', () => {
        openHandoffModal(`[Sfondo Grafico Agnes AI]\nStile/Texture: ${promptText}\nRatio: ${ratio}`);
      });
    } else {
      handoffBtn.innerHTML = '🚀 Porta in PosterLab Pro';
      handoffBtn.addEventListener('click', () => openHandoffModal(promptText));
    }
    actionsRow.appendChild(handoffBtn);

    const remixBtn = document.createElement('button');
    remixBtn.className = 'canvas-action-secondary';
    remixBtn.innerHTML = '🔄 Variazione Prompt';
    remixBtn.addEventListener('click', () => {
      if (promptInput) {
        promptInput.value = promptText;
        autoResize();
        promptInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    actionsRow.appendChild(remixBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'canvas-action-save';
    saveBtn.innerHTML = '💾 Salva nel Profilo';
    saveBtn.addEventListener('click', async () => {
      if (!window.agosSupabase) return;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Salvataggio...';
      const res = await window.agosSupabase.saveCreation({
        prompt: promptText,
        model: modelName,
        provider: providerName,
        ratio: ratio,
        imageUrl: msg.image,
        meta: msg.meta || {}
      });
      if (res && res.error) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '⚠️ ' + res.error;
        setTimeout(() => { saveBtn.innerHTML = '💾 Salva nel Profilo'; }, 3000);
      } else {
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '✅ Salvato nel Profilo';
        if (typeof loadUserCreations === 'function') loadUserCreations();
      }
    });
    actionsRow.appendChild(saveBtn);

    infoCol.appendChild(topWrap);
    infoCol.appendChild(actionsRow);

    card.appendChild(imgCol);
    card.appendChild(infoCol);

    return card;
  }

  // ---------- Render messages in Studio Canvas Feed ----------
  function renderMessages() {
    const chat = getActiveChat();
    messagesEl.innerHTML = '';
    if (!chat || !chat.messages || chat.messages.length === 0) {
      if (welcomeEl) welcomeEl.style.display = 'block';
      if (chatTitle) chatTitle.textContent = 'Nuova Sessione';
      return;
    }

    if (welcomeEl) welcomeEl.style.display = 'none';
    if (chatTitle) chatTitle.textContent = chat.title || 'Sessione Concept';

    // Reverse so newest generation is at the top of the canvas stream
    const msgs = [...chat.messages].reverse();
    for (const msg of msgs) {
      if (msg.role === 'ai' && msg.image) {
        const card = createMediaCard(msg);
        messagesEl.appendChild(card);
      } else if (msg.role === 'error') {
        const errCard = document.createElement('div');
        errCard.className = 'canvas-card error-card';
        errCard.style.cssText = 'grid-template-columns: 1fr; border-color: var(--accent-terracotta); background: rgba(224, 86, 56, 0.08);';
        errCard.innerHTML = `<div style="padding: 16px; color: var(--accent-terracotta); font-size: 0.92rem; font-weight: 600;">⚠️ ${msg.errorText || 'Errore nella generazione.'}</div>`;
        messagesEl.appendChild(errCard);
      }
    }
  }

  // ---------- Append message to Studio Canvas ----------
  function appendMessage(msg, save = true) {
    if (welcomeEl) welcomeEl.style.display = 'none';

    if (msg.role === 'ai' && msg.image) {
      const card = createMediaCard(msg);
      messagesEl.prepend(card);
    } else if (msg.role === 'error') {
      const errCard = document.createElement('div');
      errCard.className = 'canvas-card error-card';
      errCard.style.cssText = 'grid-template-columns: 1fr; border-color: var(--accent-terracotta); background: rgba(224, 86, 56, 0.08);';
      errCard.innerHTML = `<div style="padding: 16px; color: var(--accent-terracotta); font-size: 0.92rem; font-weight: 600;">⚠️ ${msg.errorText || 'Errore nella generazione.'}</div>`;
      messagesEl.prepend(errCard);
    }

    if (save && getActiveChat()) {
      getActiveChat().messages.push(msg);
      saveChats();
    }
  }

  // ---------- Loading indicator (Leonardo Studio Card) ----------
  function showLoading() {
    const el = document.createElement('div');
    el.className = 'canvas-loading-card';
    el.id = 'loadingMsg';
    el.innerHTML = `
      <div class="canvas-spinner"></div>
      <div class="canvas-loading-text">✦ Generazione del Concept in Corso...</div>
      <div class="canvas-loading-sub">Calibrazione aspect-ratio MIT-grade, rendering neurale e calcolo proporzioni.</div>
    `;
    if (welcomeEl) welcomeEl.style.display = 'none';
    messagesEl.prepend(el);
  }

  function hideLoading() {
    const el = $('loadingMsg');
    if (el) el.remove();
  }

  // ---------- Lightbox ----------
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  const lightboxImg = document.createElement('img');
  lightbox.appendChild(lightboxImg);
  document.body.appendChild(lightbox);
  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('open');
  }

  // ---------- Download ----------
  function downloadImage(url, baseName) {
    const safeName = (baseName || 'AGOS_PICT-art')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'AGOS_PICT-art';

    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith(location.origin) || url.startsWith('/')) {
      fetch(url)
        .then(r => r.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = safeName + '.png';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            URL.revokeObjectURL(a.href);
            a.remove();
          }, 1000);
        })
        .catch(() => window.open(url, '_blank'));
    } else {
      window.open(url, '_blank');
    }
  }

  const RATIO_DIMENSIONS = {
    "1:1": { w: 1024, h: 1024 },
    "16:9": { w: 1280, h: 720 },
    "9:16": { w: 720, h: 1280 },
    "4:5": { w: 864, h: 1080 },
    "3:4": { w: 768, h: 1024 },
    "2:3": { w: 720, h: 1080 },
    "3:2": { w: 1080, h: 720 },
    "21:9": { w: 1344, h: 576 },
  };

  function getRatioDimensions(ratio) {
    return RATIO_DIMENSIONS[ratio] || RATIO_DIMENSIONS["1:1"];
  }

  function cropImageToRatio(imageUrl, targetRatio, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { w: targetW, h: targetH } = getRatioDimensions(targetRatio);
      const targetAspect = targetW / targetH;
      const srcAspect = img.width / img.height;

      let sx, sy, sWidth, sHeight;
      if (srcAspect > targetAspect) {
        sHeight = img.height;
        sWidth = img.height * targetAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        callback(url);
      }, 'image/png');
    };
    img.onerror = () => callback(imageUrl);
    img.src = imageUrl;
  }

  // ---------- API call ----------
  async function generateImage(prompt, quality, ratio, imageRef) {
    const dims = getRatioDimensions(ratio);
    const model = modelSelect.value;
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          quality,
          ratio,
          width: dims.w,
          height: dims.h,
          model,
          image: imageRef || null
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));

      if (data.image_url) {
        return { ok: true, image: data.image_url, provider: data.provider, meta: data.meta || {} };
      }
      if (data.b64_json) {
        const mime = data.mime_type || 'image/png';
        return { ok: true, image: 'data:' + mime + ';base64,' + data.b64_json, provider: data.provider, meta: data.meta || {} };
      }
      throw new Error('Risposta senza immagine');
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Helper per estrarre colori palette in modo safe (sia array che object)
  function getPaletteColors(palette) {
    if (Array.isArray(palette)) return palette;
    if (palette && typeof palette === 'object') {
      return [palette.primary, palette.secondary, palette.accent, palette.glow].filter(Boolean);
    }
    return ['#e05638', '#e5a823', '#0099cc'];
  }

  // ---------- Load available models ----------
  async function loadModels() {
    try {
      const resp = await fetch('/models');
      const data = await resp.json();
      if (data.models && data.models.length > 0) {
        availableModels = data.models;
        modelSelect.innerHTML = '';
        const list = data.models_detailed || data.models.map(m => ({ id: m, name: m }));
        for (const item of list) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = item.name || item.id;
          if (item.id === data.default) opt.selected = true;
          modelSelect.appendChild(opt);
        }
        updateModelCostIndicator();
        updateModelPillUI();
        renderModelSheet(list);
      }
    } catch (e) {
      console.warn('Failed to load models', e);
    }
  }

  // ---------- Check API status ----------
  async function checkStatus() {
    statusDot.className = 'status-dot pending';
    statusText.textContent = 'Verifica Router...';
    try {
      const resp = await fetch('/status');
      const data = await resp.json();
      if (data.key_configured || data.router_enabled) {
        statusDot.className = 'status-dot ok';
        const activeTiers = [];
        if (data.key_configured) activeTiers.push('Qwen');
        if (data.gemini_configured || data.key_configured) activeTiers.push('Gemini');
        if (data.agnes_configured) activeTiers.push('Agnes');
        statusText.textContent = 'Router attivo (' + (activeTiers.length ? activeTiers.join('+') : 'Online') + ')';
      } else {
        statusDot.className = 'status-dot err';
        statusText.textContent = 'Nessun provider attivo';
      }
    } catch (e) {
      statusDot.className = 'status-dot err';
      statusText.textContent = 'Server non raggiungibile';
    }
  }

  // ---------- Pre-Prompt Styles System ----------
  async function loadStyles() {
    try {
      const resp = await fetch('/styles.json');
      if (resp.ok) {
        stylesData = await resp.json();
        renderStylesDrawer('all', '');
      }
    } catch (e) {
      console.warn('Errore nel caricamento di styles.json', e);
    }
  }

  function renderStylesDrawer(category = 'all', searchQuery = '') {
    if (!stylesGrid) return;
    stylesGrid.innerHTML = '';
    const q = (searchQuery || '').toLowerCase().trim();

    const filtered = stylesData.filter(st => {
      const matchesCat = category === 'all' || st.category === category;
      const matchesQ = !q ||
        st.name.toLowerCase().includes(q) ||
        (st.visual_direction && st.visual_direction.toLowerCase().includes(q)) ||
        (st.mood_keywords && st.mood_keywords.some(k => k.toLowerCase().includes(q)));
      return matchesCat && matchesQ;
    });

    if (filtered.length === 0) {
      stylesGrid.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:0.85rem;">Nessuno stile corrisponde alla ricerca.</div>';
      return;
    }

    filtered.forEach(st => {
      const isSignature = st.id === 'agtechdesigne_official' || st.id === 'agos_spectrum_signature' || st.is_signature;
      const card = document.createElement('div');
      card.className = 'style-card' + (activeStyle && activeStyle.id === st.id ? ' selected' : '') + (isSignature ? ' agos-signature-card' : '');

      // Integrated Preview Image Thumbnail
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'style-card-thumb-wrap';

      const img = document.createElement('img');
      img.className = 'style-card-thumb';
      img.alt = st.name;
      img.src = st.preview_image || '/style_previews/creativo.jpg';
      img.onerror = function () {
        this.src = '/style_previews/creativo.jpg';
      };
      thumbWrap.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'style-card-thumb-overlay';

      const thumbTop = document.createElement('div');
      thumbTop.className = 'style-card-thumb-top';

      const catBadge = document.createElement('span');
      catBadge.className = 'style-category-tag' + (isSignature ? ' agos-signature-tag' : '');
      catBadge.textContent = isSignature ? '✦ AGTECHDESIGNE OFFICIAL' : (st.category || 'stile').replace('_', ' ');
      thumbTop.appendChild(catBadge);

      const colors = getPaletteColors(st.palette);
      if (colors.length) {
        const swatches = document.createElement('div');
        swatches.className = 'style-palette-swatch';
        colors.slice(0, 3).forEach(color => {
          const dot = document.createElement('span');
          dot.className = 'palette-dot';
          dot.style.backgroundColor = color;
          swatches.appendChild(dot);
        });
        thumbTop.appendChild(swatches);
      }

      overlay.appendChild(thumbTop);
      thumbWrap.appendChild(overlay);
      card.appendChild(thumbWrap);

      // Card Content Body
      const body = document.createElement('div');
      body.className = 'style-card-body';

      const title = document.createElement('h4');
      title.className = 'style-card-title';
      title.textContent = st.name;
      body.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'style-card-desc';
      desc.textContent = st.visual_direction || (st.prompt_full ? st.prompt_full.slice(0, 110) + '...' : '');
      body.appendChild(desc);

      const footer = document.createElement('div');
      footer.className = 'style-card-footer';

      const kwWrap = document.createElement('div');
      kwWrap.className = 'style-keywords';
      (st.mood_keywords || []).slice(0, 3).forEach(kw => {
        const tag = document.createElement('span');
        tag.className = 'style-keyword-tag';
        tag.textContent = kw;
        kwWrap.appendChild(tag);
      });
      footer.appendChild(kwWrap);

      const action = document.createElement('span');
      action.className = 'style-select-action';
      action.textContent = activeStyle && activeStyle.id === st.id ? '✓ Attivo' : '+ Applica';
      footer.appendChild(action);

      body.appendChild(footer);
      card.appendChild(body);

      card.addEventListener('click', () => {
        selectStyle(st);
        if (window.innerWidth <= 768) {
          toggleRightSidebar(false);
        }
      });

      stylesGrid.appendChild(card);
    });
  }

  function selectStyle(st) {
    activeStyle = st;
    if (activeStyle) {
      if (activeStyleName) activeStyleName.textContent = activeStyle.name;
      if (activeStyleTagText) activeStyleTagText.textContent = activeStyle.name;
      if (activeStylePill) activeStylePill.style.display = 'inline-flex';
      if (composerBox) composerBox.classList.add('has-style');

      const colors = getPaletteColors(st.palette);

      // Render RGB Mix dots on active pill
      if (activeStyleRgbDots) {
        activeStyleRgbDots.innerHTML = '';
        colors.forEach(color => {
          const dot = document.createElement('span');
          dot.className = 'pill-dot';
          dot.style.backgroundColor = color;
          dot.style.display = 'inline-block';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.marginRight = '3px';
          activeStyleRgbDots.appendChild(dot);
        });
      }

      // Update Active Style Banner in Right Drawer
      if (activeStyleBanner) {
        activeStyleBanner.style.display = 'flex';
        if (bannerStyleName) bannerStyleName.textContent = activeStyle.name;
        if (bannerRgbMix) {
          bannerRgbMix.textContent = colors.length ? colors.join(' · ') : 'RGB Style Blend';
        }
        if (bannerColorStrip && colors.length >= 2) {
          bannerColorStrip.style.background = `linear-gradient(to bottom, ${colors.join(', ')})`;
        }
      }

      // Update CSS Variables for dynamic RGB glow
      if (colors.length) {
        document.documentElement.style.setProperty('--active-style-c1', colors[0]);
        if (colors[1]) document.documentElement.style.setProperty('--active-style-c2', colors[1]);
      }
    } else {
      clearActiveStyle();
    }
    renderStylesDrawer(currentCategory, currentSearchQuery);
  }

  function clearActiveStyle() {
    activeStyle = null;
    if (activeStylePill) activeStylePill.style.display = 'none';
    if (activeStyleName) activeStyleName.textContent = 'Nessuno stile attivo';
    if (activeStyleTagText) activeStyleTagText.textContent = 'Nessuno';
    if (activeStyleRgbDots) activeStyleRgbDots.innerHTML = '';
    if (activeStyleBanner) activeStyleBanner.style.display = 'none';
    if (composerBox) composerBox.classList.remove('has-style');
    document.documentElement.style.removeProperty('--active-style-c1');
    document.documentElement.style.removeProperty('--active-style-c2');
    renderStylesDrawer(currentCategory, currentSearchQuery);
  }

  function toggleLeftSidebar(forceState) {
    if (!sidebar) return;
    const willOpen = typeof forceState === 'boolean' ? forceState : sidebar.classList.contains('closed');
    if (willOpen) {
      sidebar.classList.remove('closed');
      sidebar.classList.add('open');
      if (leftHandleArrow) leftHandleArrow.textContent = '◀';
      if (sidebarOverlay && window.innerWidth <= 900) sidebarOverlay.style.display = 'block';
    } else {
      sidebar.classList.add('closed');
      sidebar.classList.remove('open');
      if (leftHandleArrow) leftHandleArrow.textContent = '▶';
      if (sidebarOverlay) sidebarOverlay.style.display = 'none';
    }
  }

  function toggleRightSidebar(forceState) {
    if (!rightSidebar) return;
    const willOpen = typeof forceState === 'boolean' ? forceState : rightSidebar.classList.contains('closed');
    if (willOpen) {
      rightSidebar.classList.remove('closed');
      if (appRoot) appRoot.classList.add('right-open');
      if (handleArrow) handleArrow.textContent = '▶';
      if (styleSearchInput && window.innerWidth > 768) styleSearchInput.focus();
    } else {
      rightSidebar.classList.add('closed');
      if (appRoot) appRoot.classList.remove('right-open');
      if (handleArrow) handleArrow.textContent = '◀';
    }
    if (rightSidebarOverlay) {
      rightSidebarOverlay.classList.toggle('active', willOpen && window.innerWidth <= 1024);
    }
  }

  function openHandoffModal(promptText) {
    currentHandoffPrompt = promptText || (activeStyle ? activeStyle.prompt_full : promptInput.value);
    if (handoffModal) {
      handoffModal.classList.add('open');
      handoffModal.style.display = 'flex';
    }
  }

  function closeHandoffModal() {
    if (handoffModal) {
      handoffModal.classList.remove('open');
      handoffModal.style.display = 'none';
    }
  }

  function openCreditsModal() {
    updateCreditsUI();
    if (creditsModal) {
      creditsModal.classList.add('open');
      creditsModal.style.display = 'flex';
    }
  }

  function closeCreditsModal() {
    if (creditsModal) {
      creditsModal.classList.remove('open');
      creditsModal.style.display = 'none';
    }
  }

  // ---------- Send prompt ----------
  async function sendPrompt() {
    const prompt = promptInput.value.trim();
    const imageRef = attachedImage ? attachedImage.dataUrl : null;
    if ((!prompt && !imageRef && !activeStyle) || busy) return;

    // Controllo crediti utente
    const chosenModel = modelSelect.value;
    const modelCost = getModelCreditCost(chosenModel);
    const currentBal = getCredits();
    if (modelCost > 0 && currentBal < modelCost) {
      updateCreditsUI();
      if (creditsModal) creditsModal.style.display = 'flex';
      alert(`⚠️ Crediti insufficienti!\n\nIl modello ${chosenModel} richiede ${modelCost} crediti, ma il tuo saldo attuale è di ${currentBal} crediti.\n\nPuoi scegliere un modello gratuito (Smart Router, Qwen Image Max, Agnes Background Studio) oppure ricaricare i crediti con il tasto bonus!`);
      return;
    }

    let chat = getActiveChat();
    const promptForTitle = prompt || (activeStyle ? activeStyle.name : 'Riferimento Immagine');
    if (!chat) {
      chat = { id: uid(), title: makeTitle(promptForTitle), messages: [] };
      chats.unshift(chat);
      activeChatId = chat.id;
      renderChatList();
      welcomeEl.style.display = 'none';
      chatTitle.textContent = chat.title;
    } else if (chat.messages.length === 0) {
      chat.title = makeTitle(promptForTitle);
      renderChatList();
      chatTitle.textContent = chat.title;
    }

    // Build enriched prompt using active pre-prompt style
    let promptToSend = prompt;
    let styleNameUsed = null;
    if (activeStyle) {
      styleNameUsed = activeStyle.name;
      const styleInstruction = activeStyle.prompt_full || `Visual Style: ${activeStyle.name}. ${activeStyle.visual_direction || ''}`;
      promptToSend = prompt ? `${prompt}. Style direction: ${styleInstruction}` : styleInstruction;
    }

    // Append user message with attached reference image and style tag if present
    appendMessage({ role: 'user', text: prompt, image_ref: imageRef, style_name: styleNameUsed }, true);

    // Clear inputs and previews
    promptInput.value = '';
    clearAttachedImage();
    autoResize();
    setBusy(true);

    showLoading();
    const quality = qualitySelect.value;
    const ratio = ratioSelect.value;
    const result = await generateImage(promptToSend, quality, ratio, imageRef);
    hideLoading();
    setBusy(false);

    if (result.ok) {
      if (modelCost > 0) {
        deductCredits(modelCost);
      }

      const finalRatio = ratio;
      const isBg = result.meta && result.meta.is_background;

      const aiMsg = {
        role: 'ai',
        text: isBg
          ? `✨ Sfondo & Texture generati con successo! (Free - 0 crediti). Pronto come canvas per PosterLab Pro.`
          : `✨ Poster generato con successo! ${modelCost > 0 ? '(-' + modelCost + ' crediti)' : '(Free)'}`,
        image: result.image,
        prompt: promptToSend,
        provider: result.provider,
        meta: { ...result.meta, ratio: finalRatio }
      };
      appendMessage(aiMsg, true);
    } else {
      appendMessage({ role: 'error', errorText: '❌ ' + result.error }, true);
    }
    saveChats();
    renderChatList();
  }

  // ---------- Busy / UI state ----------
  function setBusy(state) {
    busy = state;
    updateSendButton();
    document.querySelectorAll('.chip, .quick-chip, .specimen-use-btn').forEach(ch => {
      ch.disabled = state;
      ch.style.opacity = state ? '0.5' : '1';
    });
  }

  function updateSendButton() {
    const hasContent = Boolean(promptInput.value.trim() || attachedImage || activeStyle);
    sendBtn.disabled = busy || !hasContent;
  }

  // ---------- Textarea autoresize ----------
  function autoResize() {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 160) + 'px';
    updateSendButton();
  }

  // ---------- New chat ----------
  function newChat() {
    activeChatId = null;
    clearAttachedImage();
    clearActiveStyle();
    renderChatList();
    renderMessages();
    promptInput.focus();
    sidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
  }

  // ---------- Clear current chat ----------
  function clearChat() {
    const chat = getActiveChat();
    if (!chat) return;
    if (confirm('Azzera i messaggi di questa sessione?')) {
      chat.messages = [];
      clearAttachedImage();
      clearActiveStyle();
      saveChats();
      renderMessages();
    }
  }

  // ---------- Specimen Card Quick Prompt (Creative Style) ----------
  if (useSpecimenBtn) {
    useSpecimenBtn.addEventListener('click', () => {
      promptInput.value = 'AGOS Pict Creative Style: experimental graphic design poster, expressive composition with intentional tension, bold unexpected color combinations with terracotta, deep ultramarine cyan, ochre gold and raw linen, mixed typography styles with elegant serif and bold sans, layered depth, subtle screenprint and risograph textures, hand-drawn mixed media collage elements, museum-quality visual presentation';
      autoResize();
      promptInput.focus();
    });
  }

  // ---------- Events ----------
  promptInput.addEventListener('input', autoResize);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
  sendBtn.addEventListener('click', sendPrompt);
  newChatBtn.addEventListener('click', newChat);
  clearBtn.addEventListener('click', clearChat);

  // Left Sidebar Triggers
  menuBtn.addEventListener('click', () => toggleLeftSidebar());
  if (toggleLeftSidebarBtn) toggleLeftSidebarBtn.addEventListener('click', () => toggleLeftSidebar());
  if (closeLeftSidebarBtn) closeLeftSidebarBtn.addEventListener('click', () => toggleLeftSidebar(false));
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => toggleLeftSidebar(false));

  // Right Sidebar (Styles Menu a scomparsa a destra) Triggers
  if (toggleRightSidebarBtn) toggleRightSidebarBtn.addEventListener('click', () => toggleRightSidebar());
  if (closeRightSidebarBtn) closeRightSidebarBtn.addEventListener('click', () => toggleRightSidebar(false));
  if (rightSidebarOverlay) rightSidebarOverlay.addEventListener('click', () => toggleRightSidebar(false));
  if (bannerClearBtn) bannerClearBtn.addEventListener('click', clearActiveStyle);

  // Active Style Pill Clear
  if (clearActiveStyleBtn) clearActiveStyleBtn.addEventListener('click', clearActiveStyle);

  // Category Filtering
  if (styleCategories) {
    styleCategories.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      styleCategories.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat || 'all';
      renderStylesDrawer(currentCategory, currentSearchQuery);
    });
  }

  // Search Input Filtering
  if (styleSearchInput) {
    styleSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderStylesDrawer(currentCategory, currentSearchQuery);
    });
  }

  // Credits System & Refill Modal Dialog
  if (modelSelect) modelSelect.addEventListener('change', updateModelCostIndicator);
  const sidebarCreditsBtn = document.getElementById('sidebarCreditsBtn');
  if (sidebarCreditsBtn) {
    sidebarCreditsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCreditsModal();
    });
  }
  if (creditsBadge) {
    creditsBadge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCreditsModal();
    });
  }
  if (closeCreditsBtn) {
    closeCreditsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCreditsModal();
    });
  }
  if (closeCreditsOkBtn) {
    closeCreditsOkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCreditsModal();
    });
  }
  if (creditsModal) {
    creditsModal.addEventListener('click', (e) => {
      if (e.target === creditsModal) {
        closeCreditsModal();
      }
    });
  }
  if (refillCreditsBtn) {
    refillCreditsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addCredits(150);
      alert('✨ Ricarica effettuata! +150 crediti aggiunti al tuo saldo.');
      closeCreditsModal();
    });
  }

  // Mobile Model Sheet Triggers
  if (modelPillBtn) {
    modelPillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModelSheet();
    });
  }
  if (closeModelSheetBtn) {
    closeModelSheetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModelSheet();
    });
  }
  if (modelSheetBackdrop) {
    modelSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === modelSheetBackdrop) closeModelSheet();
    });
  }

  // Mobile Settings Sheet Triggers (Aspect Ratio & Quality)
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSettingsSheet();
    });
  }
  if (closeSettingsSheetBtn) {
    closeSettingsSheetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsSheet();
    });
  }
  if (applySettingsBtn) {
    applySettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsSheet();
    });
  }
  if (settingsSheetBackdrop) {
    settingsSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === settingsSheetBackdrop) closeSettingsSheet();
    });
  }

  // Ratio Option Grid Selection in Settings Sheet
  if (ratioOptionsGrid) {
    ratioOptionsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.ratio-chip-opt');
      if (!btn) return;
      const ratio = btn.dataset.ratio;
      if (ratioSelect) ratioSelect.value = ratio;
      if (ratioSummaryPill) ratioSummaryPill.textContent = ratio;
      ratioOptionsGrid.querySelectorAll('.ratio-chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  // Quality Segmented Control in Settings Sheet
  if (qualitySegmentControl) {
    qualitySegmentControl.addEventListener('click', (e) => {
      const btn = e.target.closest('.quality-seg-btn');
      if (!btn) return;
      const quality = btn.dataset.quality;
      if (qualitySelect) qualitySelect.value = quality;
      qualitySegmentControl.querySelectorAll('.quality-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  // Styles Tool Button Trigger in Toolbar
  if (stylesToolBtn) {
    stylesToolBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRightSidebar(true);
    });
  }

  // Header Stili Button Trigger
  if (headerStiliBtn) {
    headerStiliBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRightSidebar();
    });
  }

  // Sidebar Open Styles Button Trigger
  if (sidebarOpenStylesBtn) {
    sidebarOpenStylesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRightSidebar(true);
    });
  }

  // Clear Active Style from Prompt Pill
  if (clearActiveStylePillBtn) {
    clearActiveStylePillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearActiveStyle();
    });
  }

  // Ratio Tiles Grid in Studio Sidebar
  if (ratioTilesGrid) {
    ratioTilesGrid.addEventListener('click', (e) => {
      const tile = e.target.closest('.ratio-tile');
      if (!tile) return;
      const r = tile.dataset.ratio;
      selectRatio(r);
    });
  }

  // Quality Segmented Control in Studio Sidebar
  if (qualitySegmented) {
    qualitySegmented.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const q = btn.dataset.quality;
      if (qualitySelect) qualitySelect.value = q;
      qualitySegmented.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  // Reset to Defaults Button in Studio Sidebar
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      selectRatio('1:1');
      if (qualitySelect) qualitySelect.value = 'auto';
      if (qualitySegmented) {
        qualitySegmented.querySelectorAll('.seg-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.quality === 'auto');
        });
      }
      if (modelSelect) {
        modelSelect.value = 'auto-router';
        updateModelCostIndicator();
      }
      clearActiveStyle();
      clearAttachedImage();
      promptInput.value = '';
      autoResize();
    });
  }

  // Keyboard Escape to close any open modal or bottom sheet
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCreditsModal();
      closeHandoffModal();
      closeModelSheet();
      closeSettingsSheet();
      if (window.innerWidth <= 900) toggleLeftSidebar(false);
      toggleRightSidebar(false);
      if (lightbox) lightbox.classList.remove('open');
    }
  });

  // PosterLab Pro Handoff Dialog
  if (closeHandoffBtn) {
    closeHandoffBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeHandoffModal();
    });
  }
  if (closeHandoffOkBtn) {
    closeHandoffOkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeHandoffModal();
    });
  }
  if (handoffModal) {
    handoffModal.addEventListener('click', (e) => {
      if (e.target === handoffModal) closeHandoffModal();
    });
  }
  if (copyConceptPromptBtn) {
    copyConceptPromptBtn.addEventListener('click', () => {
      const textToCopy = `[AGOS Pict Concept Hand-Off]\nPrompt: ${currentHandoffPrompt}\nRatio: ${ratioSelect.value}\nStyle: ${activeStyle ? activeStyle.name : 'Custom'}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const orig = copyConceptPromptBtn.textContent;
        copyConceptPromptBtn.textContent = '✓ Copiato negli appunti!';
        setTimeout(() => {
          copyConceptPromptBtn.textContent = orig;
        }, 2200);
      }).catch(() => {
        alert('Prompt:\n' + textToCopy);
      });
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('chip')) {
      promptInput.value = e.target.textContent.replace(/^[^\w\s]+/, '').trim();
      autoResize();
      sendPrompt();
    }
  });

  // =========================================================================
  // SUPABASE & MY PROFILE INTEGRATION (Official AGOS_PICT STUDIO)
  // =========================================================================
  const userProfileBtn = $('userProfileBtn');
  const profileModal = $('profileModal');
  const closeProfileBtn = $('closeProfileBtn');
  const headerUserAvatar = $('headerUserAvatar');
  const headerUserDot = $('headerUserDot');
  const headerUserName = $('headerUserName');

  const profAvatarImg = $('profAvatarImg');
  const profDisplayName = $('profDisplayName');
  const profTierBadge = $('profTierBadge');
  const profEmail = $('profEmail');
  const profCreditsBig = $('profCreditsBig');
  const profRefillBtn = $('profRefillBtn');

  const profUnauthenticatedView = $('profUnauthenticatedView');
  const profAuthenticatedView = $('profAuthenticatedView');
  const googleLoginBtn = $('googleLoginBtn');
  const logoutBtn = $('logoutBtn');
  const profUserIdShort = $('profUserIdShort');
  const profPlanName = $('profPlanName');
  const profUserRole = $('profUserRole');

  const userCreationsGrid = $('userCreationsGrid');
  const emptyCreationsMsg = $('emptyCreationsMsg');
  const profCreationsCount = $('profCreationsCount');
  const brandTemplatesGrid = $('brandTemplatesGrid');
  const profTemplatesCount = $('profTemplatesCount');

  const settingDefaultModel = $('settingDefaultModel');
  const settingDefaultRatio = $('settingDefaultRatio');
  const settingBrandPrompt = $('settingBrandPrompt');
  const saveSettingsBtn = $('saveSettingsBtn');
  const settingsFeedback = $('settingsFeedback');

  function openProfileModal() {
    if (profileModal) profileModal.style.display = 'flex';
  }

  function closeProfileModal() {
    if (profileModal) profileModal.style.display = 'none';
  }

  if (userProfileBtn) userProfileBtn.addEventListener('click', openProfileModal);
  if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfileModal);
  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  // Profile Tab switching
  const profTabButtons = document.querySelectorAll('.prof-tab-btn');
  profTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      profTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.profile-tab-content').forEach(tc => tc.classList.remove('active'));
      const activeContent = $(`profTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
      if (activeContent) activeContent.classList.add('active');
      if (targetTab === 'creations') loadUserCreations();
      if (targetTab === 'templates') loadBrandTemplates();
    });
  });

  // Google Login & Logout
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      if (window.agosSupabase) window.agosSupabase.signInWithGoogle();
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.agosSupabase) window.agosSupabase.signOut();
    });
  }

  // Refill Credits inside Profile Modal
  if (profRefillBtn) {
    profRefillBtn.addEventListener('click', async () => {
      userCredits += 150;
      updateCreditsUI();
      if (profCreditsBig) profCreditsBig.textContent = userCredits;
      const user = window.agosSupabase && window.agosSupabase.getUser();
      if (user) {
        await window.agosSupabase.syncCredits(user.id, userCredits);
      }
      profRefillBtn.textContent = '✓ Bonus Riscattato (+150)!';
      setTimeout(() => { profRefillBtn.textContent = '🎁 Riscatta Bonus (+150)'; }, 2500);
    });
  }

  // Save Settings
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const user = window.agosSupabase && window.agosSupabase.getUser();
      const settings = {
        default_model: settingDefaultModel ? settingDefaultModel.value : 'auto-router',
        default_ratio: settingDefaultRatio ? settingDefaultRatio.value : '1:1',
        custom_brand_prompt: settingBrandPrompt ? settingBrandPrompt.value.trim() : ''
      };
      if (modelSelect && settings.default_model) modelSelect.value = settings.default_model;
      if (ratioSelect && settings.default_ratio) {
        ratioSelect.value = settings.default_ratio;
        updateActiveRatioTileUI(settings.default_ratio);
      }
      if (user && window.agosSupabase) {
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.textContent = 'Salvataggio...';
        await window.agosSupabase.updateUserSettings(user.id, settings);
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = '💾 Salva Preferenze';
      }
      if (settingsFeedback) {
        settingsFeedback.textContent = '✓ Preferenze salvate!';
        setTimeout(() => { settingsFeedback.textContent = ''; }, 3000);
      }
    });
  }

  // Load User Creations from Supabase
  async function loadUserCreations() {
    if (!window.agosSupabase || !userCreationsGrid) return;
    const user = window.agosSupabase.getUser();
    if (!user) {
      if (emptyCreationsMsg) emptyCreationsMsg.style.display = 'block';
      return;
    }
    const creations = await window.agosSupabase.fetchUserCreations(user.id);
    if (profCreationsCount) profCreationsCount.textContent = creations.length;
    if (!creations || creations.length === 0) {
      if (emptyCreationsMsg) emptyCreationsMsg.style.display = 'block';
      userCreationsGrid.innerHTML = '';
      userCreationsGrid.appendChild(emptyCreationsMsg);
      return;
    }

    userCreationsGrid.innerHTML = '';
    creations.forEach(cr => {
      const card = document.createElement('div');
      card.className = 'vault-creation-card';
      card.innerHTML = `
        <div class="vault-thumb-wrap">
          <img src="${cr.image_url}" alt="Concept" class="vault-thumb-img" loading="lazy">
        </div>
        <div class="vault-card-body">
          <p class="vault-card-prompt" title="${cr.prompt}">${cr.prompt}</p>
          <div class="vault-card-footer">
            <span class="vault-ratio-pill">${cr.ratio || '1:1'}</span>
            <button type="button" class="vault-delete-btn" title="Elimina concept">🗑</button>
          </div>
        </div>
      `;
      const delBtn = card.querySelector('.vault-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm("Vuoi rimuovere questa creazione dal tuo profilo?")) {
            await window.agosSupabase.deleteCreation(cr.id);
            card.remove();
            loadUserCreations();
          }
        });
      }
      card.addEventListener('click', () => {
        openLightbox(cr.image_url, cr.prompt);
      });
      userCreationsGrid.appendChild(card);
    });
  }

  // Load Brand Templates from Supabase
  async function loadBrandTemplates() {
    if (!window.agosSupabase || !brandTemplatesGrid) return;
    const templates = await window.agosSupabase.fetchBrandTemplates();
    if (profTemplatesCount) profTemplatesCount.textContent = templates.length;
    if (!templates || templates.length === 0) return;

    brandTemplatesGrid.innerHTML = '';
    templates.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'brand-template-card';
      const paletteHtml = (tpl.palette || []).map(hex => `<span class="palette-dot" style="background:${hex};" title="${hex}"></span>`).join('');
      card.innerHTML = `
        <div class="brand-template-preview">
          <img src="${tpl.preview_url || '/style_previews/agtechdesigne_official.jpg'}" alt="${tpl.title}" loading="lazy">
        </div>
        <div class="brand-template-body">
          <h5 class="brand-template-title">${tpl.title}</h5>
          <div class="brand-template-palette">${paletteHtml}</div>
          <button type="button" class="brand-template-use-btn">✦ Applica Template</button>
        </div>
      `;
      const useBtn = card.querySelector('.brand-template-use-btn');
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          if (promptInput) {
            promptInput.value = tpl.prompt_template;
            autoResize();
            promptInput.focus();
            closeProfileModal();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }
      brandTemplatesGrid.appendChild(card);
    });
  }

  // Initialize Supabase Auth & Session State
  async function initSupabaseProfile() {
    if (!window.agosSupabase) return;
    const sb = window.agosSupabase.getClient();
    if (!sb) return;

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session && session.user) {
        await applyUserSession(session.user);
      } else {
        applyUnauthenticatedState();
      }

      sb.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          await applyUserSession(session.user);
        } else {
          applyUnauthenticatedState();
        }
      });
    } catch (e) {
      console.warn("[SUPABASE] Init exception:", e);
      applyUnauthenticatedState();
    }

    loadBrandTemplates();
  }

  async function applyUserSession(user) {
    if (!window.agosSupabase) return;
    window.agosSupabase.setUser(user);
    const profile = await window.agosSupabase.fetchProfile(user.id);
    const settings = await window.agosSupabase.fetchUserSettings(user.id);

    // Header UI
    if (headerUserAvatar) {
      const avatarUrl = (profile && profile.avatar_url) || (user.user_metadata && user.user_metadata.avatar_url) || '/apple-touch-icon.png';
      headerUserAvatar.src = avatarUrl;
    }
    if (headerUserName) {
      const name = (profile && profile.display_name) || (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
      headerUserName.textContent = name;
    }
    if (headerUserDot) headerUserDot.classList.add('active');

    // Modal UI
    if (profAvatarImg) {
      profAvatarImg.src = (profile && profile.avatar_url) || (user.user_metadata && user.user_metadata.avatar_url) || '/apple-touch-icon.png';
    }
    if (profDisplayName) {
      profDisplayName.textContent = (profile && profile.display_name) || (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
    }
    if (profEmail) profEmail.textContent = user.email || '';
    if (profTierBadge) {
      const tier = (profile && profile.plan_tier) || 'free';
      profTierBadge.textContent = tier.toUpperCase().replace('_', ' ');
      profTierBadge.className = `profile-tier-badge ${tier}`;
    }

    // Credits sync
    if (profile && typeof profile.credits === 'number') {
      userCredits = profile.credits;
      updateCreditsUI();
      if (profCreditsBig) profCreditsBig.textContent = userCredits;
    }

    // Auth Views Toggle
    if (profUnauthenticatedView) profUnauthenticatedView.style.display = 'none';
    if (profAuthenticatedView) profAuthenticatedView.style.display = 'block';

    if (profUserIdShort) profUserIdShort.textContent = user.id.slice(0, 8) + '...';
    if (profPlanName) profPlanName.textContent = (profile && profile.plan_tier ? profile.plan_tier.toUpperCase() : 'FREE TIER');
    if (profUserRole) profUserRole.textContent = (profile && profile.role ? profile.role.toUpperCase() : 'USER');

    // Settings sync
    if (settings) {
      if (settingDefaultModel && settings.default_model) settingDefaultModel.value = settings.default_model;
      if (settingDefaultRatio && settings.default_ratio) settingDefaultRatio.value = settings.default_ratio;
      if (settingBrandPrompt && settings.custom_brand_prompt) settingBrandPrompt.value = settings.custom_brand_prompt;
    }

    // Carica le creazioni personali
    loadUserCreations();
  }

  function applyUnauthenticatedState() {
    if (headerUserName) headerUserName.textContent = 'Accedi';
    if (headerUserAvatar) headerUserAvatar.src = '/apple-touch-icon.png';
    if (headerUserDot) headerUserDot.classList.remove('active');

    if (profDisplayName) profDisplayName.textContent = 'agtechdesigne Creator';
    if (profTierBadge) {
      profTierBadge.textContent = 'FREE TIER';
      profTierBadge.className = 'profile-tier-badge free';
    }
    if (profEmail) profEmail.textContent = 'Non autenticato — Accedi con Google per salvare concept e crediti';
    if (profCreditsBig) profCreditsBig.textContent = userCredits;

    if (profUnauthenticatedView) profUnauthenticatedView.style.display = 'block';
    if (profAuthenticatedView) profAuthenticatedView.style.display = 'none';
  }

  // ---------- Init ----------
  updateCreditsUI();
  loadChats();
  renderChatList();
  renderMessages();
  checkStatus();
  loadModels();
  loadStyles();
  initSupabaseProfile();
  if (!getActiveChat()) {
    newChat();
  }
  promptInput.focus();
})();
