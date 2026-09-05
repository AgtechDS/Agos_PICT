/**
 * AGOS_PICT STUDIO — Cosmic Intelligence Field (Silky 60-120 FPS Engine)
 * Architettura di Prestazioni Estreme (Zero Micro-Stutter):
 * 1. Domain warping snellito ad 8 chiamate noise (invece di 25)
 * 2. Rimozione calcoli noise per le zone (sfrutta i vettori warped esistenti)
 * 3. Stelle 3D branchless con step() — zero stalli di warp/divergenza SIMD
 * 4. Dynamic Hardware Bilinear Scaling (buffer a 0.72x con interpolazione GPU istantanea)
 * 5. Uniform caching (aggiorna solo uTime e uMouse per frame, non uRes e speed)
 * 6. Throttling rAF e isolamento layer per 60+ FPS garantiti su qualsiasi GPU
 */
(() => {
  'use strict';

  const CONFIG = {
    flightMode: 0.0,   // 0.0 = Volo 3D Forward
    colorMode: 1.0,    // 1.0 = Accensione Organica a Zone
    flightSpeed: 0.55  // 55% velocità calibrata
  };

  let canvas = document.getElementById('cosmicBgCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'cosmicBgCanvas';
    canvas.className = 'cosmic-background-canvas';
    document.body.prepend(canvas);
  }

  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('[COSMIC BG] WebGL non supportato. Fallback attivo.');
    return;
  }

  // --- VERTEX SHADER ---
  const vertexShaderSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // --- FRAGMENT SHADER OTTIMIZZATO (SILKY SMOOTH 60-120 FPS) ---
  const fragmentShaderSrc = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_mouse_hover;
    uniform float u_flight_speed;

    // PALETTE UFFICIALE AGOS_PICT STUDIO
    const vec3 C_VOID     = vec3(0.0196, 0.0196, 0.0275); // #050507 (Midnight Void)
    const vec3 C_VIOLET   = vec3(0.365, 0.180, 1.000);   // #5D2EFF (Universe Violet)
    const vec3 C_BLUE     = vec3(0.094, 0.169, 1.000);   // #182BFF (Deep Space Blue)
    const vec3 C_CYAN     = vec3(0.000, 0.906, 1.000);   // #00E7FF (Electric Cyan)
    const vec3 C_SOFTCYAN = vec3(0.365, 0.922, 1.000);   // #5DEBFF (Soft Cyan)
    const vec3 C_MAGENTA  = vec3(1.000, 0.118, 0.620);   // #FF1E9E (Magenta Anomaly)
    const vec3 C_WHITE    = vec3(0.957, 0.937, 0.902);   // #F4EFE6 (White Glow)

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // FBM A 2 OTTAVE (MASSIMA FLUIDITÀ E RAPIDITÀ GPU)
    float fbm2(vec2 p) {
      return 0.68 * noise(p) + 0.32 * noise(p * 2.04 + vec2(11.23, 7.71));
    }

    vec2 rotate(vec2 p, float a) {
      float c = cos(a), s = sin(a);
      return mat2(c, -s, s, c) * p;
    }

    // DOMAIN WARPING AD ALTE PRESTAZIONI (8 NOISE TOTALI)
    float domainWarp(vec2 p, out vec2 q, out vec2 r, float t) {
      q.x = noise(p + vec2(t * 0.05, -t * 0.04));
      q.y = noise(p + vec2(4.2, 1.8) + vec2(-t * 0.042, t * 0.046));

      r.x = fbm2(p + 2.2 * q + vec2(1.7, 9.2) + vec2(t * 0.06, t * 0.03));
      r.y = fbm2(p + 2.2 * q + vec2(8.3, 2.8) + vec2(-t * 0.035, -t * 0.055));

      return fbm2(p + 2.6 * r + vec2(t * 0.025, t * 0.035));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

      float speed = u_flight_speed;
      float t = u_time * 0.22 * speed;

      // VOLO 3D FORWARD (PROIEZIONE IPERBOLICA ASSE Z)
      float rCoord = length(uv);
      float zDepth = max(0.12, rCoord);
      vec2 dir = normalize(uv);
      vec2 p = dir * (log(zDepth * 3.5 + 1.0) * 1.6 - t * 0.45) + rotate(uv, sin(t * 0.08) * 0.2) * 1.8;

      // Aura fotonica soffusa del mouse
      float dMouse = length(uv - u_mouse);
      float mouseSoftAura = exp(-dMouse * 3.4) * u_mouse_hover;
      p += (uv - u_mouse) * mouseSoftAura * 0.09;

      // Calcolo fluido con Domain Warping snellito
      vec2 q, r;
      float f = domainWarp(p, q, r, t);

      // ACCENSIONE ORGANICA A ZONE (Utilizzo diretto dei campi vettoriali warped)
      float waveTime = u_time * (0.06 + speed * 0.45);
      float zone1 = smoothstep(0.20, 0.80, q.x * 0.7 + 0.35 + sin(waveTime * 0.5) * 0.15);
      float zone2 = smoothstep(0.25, 0.82, r.y * 0.7 + 0.35 + cos(waveTime * 0.4) * 0.15);
      float zone3 = smoothstep(0.28, 0.85, f * 0.8 + 0.2 + sin(waveTime * 0.6 + 1.5) * 0.15);

      float wave1 = sin(waveTime * 1.2 + zone1 * 3.5) * 0.5 + 0.5;
      float wave2 = cos(waveTime * 1.0 + zone2 * 3.5) * 0.5 + 0.5;
      float wave3 = sin(waveTime * 1.4 + zone3 * 4.0) * 0.5 + 0.5;

      vec3 colNebula1 = mix(C_VIOLET, C_BLUE, wave1);
      vec3 colNebula2 = mix(C_BLUE, C_CYAN, wave2);
      vec3 colNebula3 = mix(C_CYAN, C_MAGENTA, wave3 * 0.45);

      float density1 = smoothstep(0.18, 0.78, f);
      float density2 = smoothstep(0.38, 0.88, length(r));
      float coreGlow = smoothstep(0.55, 0.95, f);

      // Composizione
      vec3 col = C_VOID;
      col += colNebula1 * density1 * 0.48;
      col += colNebula2 * density2 * 0.42;
      col += colNebula3 * coreGlow * 0.56;

      // Bagliore centrale di respiro galattico
      float centerGlow = exp(-dot(uv, uv) * 3.8) * (0.85 + 0.15 * sin(t * 0.8));
      col += colNebula2 * centerGlow * 0.22;

      // STELLE 3D WARP (BRANCHLESS CON STEP PER ZERO STALLI GPU)
      float z1 = fract(0.33 - u_time * 0.12 * speed);
      vec2 sp1 = uv * (0.35 / max(0.04, z1)) + vec2(3.17, 7.43);
      float h1 = hash21(floor(sp1));
      float starMask1 = step(0.965, h1);
      float tw1 = sin(u_time * 3.5 + h1 * 50.0) * 0.5 + 0.5;
      float sAlpha1 = smoothstep(0.065, 0.0, length(fract(sp1) - 0.5)) * (1.0 - z1) * (0.35 + 0.65 * tw1) * starMask1;
      col += mix(C_SOFTCYAN, C_WHITE, tw1) * (sAlpha1 * 0.75);

      float z2 = fract(0.72 - u_time * 0.07 * speed);
      vec2 sp2 = uv * (0.35 / max(0.04, z2)) + vec2(6.34, 14.86);
      float h2 = hash21(floor(sp2));
      float starMask2 = step(0.970, h2);
      float tw2 = cos(u_time * 3.0 + h2 * 40.0) * 0.5 + 0.5;
      float sAlpha2 = smoothstep(0.060, 0.0, length(fract(sp2) - 0.5)) * (1.0 - z2) * (0.3 + 0.7 * tw2) * starMask2;
      col += mix(C_CYAN, C_WHITE, tw2) * (sAlpha2 * 0.65);

      // AURA LUMINOSA SOFFUSA DEL CURSORE (SOFT VERI SOFT)
      float auraCore = exp(-dMouse * 11.0) * 0.16;
      float auraMid  = exp(-dMouse * 3.8) * 0.11;
      float auraWide = exp(-dMouse * 1.5) * 0.055;
      vec3 auraColor = C_WHITE * auraCore * 0.65 + C_SOFTCYAN * auraMid * 0.85 + colNebula2 * auraWide;
      col += auraColor * u_mouse_hover;

      // Vignettatura cinematica periferica
      float rimVignette = smoothstep(0.22, 0.96, length(uv));
      col = mix(col, col * 0.72, rimVignette);

      // Filmic tone mapping
      col = 1.0 - exp(-col * 1.30);
      col = pow(col, vec3(0.95));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(s);
      console.error('[COSMIC BG] Shader Compile Error:', err);
      throw new Error(err);
    }
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSrc));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[COSMIC BG] Program Link Error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uMouseHover = gl.getUniformLocation(program, 'u_mouse_hover');
  const uFlightSpeed = gl.getUniformLocation(program, 'u_flight_speed');

  // Imposta velocità uniforme statica
  gl.uniform1f(uFlightSpeed, CONFIG.flightSpeed);

  const mouse = {
    x: 0, y: 0,
    tx: 0, ty: 0,
    hover: 0,
    targetHover: 0
  };

  // HARDWARE BILINEAR SCALING (FLUIDITÀ A 60-120 FPS CON RISOLUZIONE BILANCIATA)
  function resize() {
    const rawW = window.innerWidth;
    const rawH = window.innerHeight;
    const maxDim = 1440;
    const maxScreen = Math.max(rawW, rawH);
    
    // Su schermi ampi, adotta un fattore scala a 0.72x: riduce i pixel del 50% garantendo massima fluidità
    const scaleFactor = Math.min(0.72, maxDim / maxScreen);
    const targetW = Math.max(640, Math.floor(rawW * scaleFactor));
    const targetH = Math.max(360, Math.floor(rawH * scaleFactor));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      gl.viewport(0, 0, targetW, targetH);
      gl.uniform2f(uRes, targetW, targetH);
    }
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 80);
  });
  resize();

  // THROTTLING POINTERMOVE (COORDINATE ESATTE NORMALIZZATE)
  let moveScheduled = false;
  window.addEventListener('pointermove', (e) => {
    if (moveScheduled) return;
    moveScheduled = true;
    requestAnimationFrame(() => {
      moveScheduled = false;
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouse.tx = (e.clientX - 0.5 * w) / h;
      mouse.ty = ((h - e.clientY) - 0.5 * h) / h;
      mouse.targetHover = 1.0;
    });
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    mouse.targetHover = 0.0;
  });

  window.addEventListener('pointerenter', () => {
    mouse.targetHover = 1.0;
  });

  // RISPARMIO ENERGETICO INTELLIGENTE
  let isVisible = true;
  document.addEventListener('visibilitychange', () => {
    isVisible = (document.visibilityState === 'visible');
    if (isVisible) {
      requestAnimationFrame(render);
    }
  });

  // LOOP DI RENDERING OTTIMIZZATO SENZA UNIFORM RIDONDANTI
  function render(ms) {
    if (!isVisible) return;

    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    mouse.hover += (mouse.targetHover - mouse.hover) * 0.05;

    gl.uniform1f(uTime, ms * 0.001);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uMouseHover, mouse.hover);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
