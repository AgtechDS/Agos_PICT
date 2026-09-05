/**
 * AGOS_PICT STUDIO — Cosmic Intelligence Field (Live Background Engine)
 * Modalità: Volo 3D Forward + Accensione a Zone
 * Velocità di Crociera: 55% (0.55)
 * WebGL Shader puro con Domain Warping a fluido-dinamica organica e Soft Mouse Aura.
 */
(() => {
  'use strict';

  // Configurazione Iniziale
  const CONFIG = {
    flightMode: 0.0,   // 0.0 = Volo 3D Forward (Fly-Through), 1.0 = Planata
    colorMode: 1.0,    // 1.0 = Accensione Organica a Zone
    flightSpeed: 0.55  // 55% velocità calibrata dallo Studio
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
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('[COSMIC BG] WebGL non supportato su questo dispositivo. Fallback su sfondo statico.');
    return;
  }

  // --- VERTEX SHADER ---
  const vertexShaderSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // --- FRAGMENT SHADER: VOLO 3D + ACCENSIONE A ZONE (55% VELOCITÀ) ---
  const fragmentShaderSrc = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_mouse_hover;
    uniform float u_flight_mode;
    uniform float u_color_mode;
    uniform float u_flight_speed;

    #define PI 3.14159265359

    // PALETTE UFFICIALE AGTECHDESIGNE (RGB NORMALIZZATI)
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
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for(int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.04 + vec2(11.23, 7.71);
        a *= 0.5;
      }
      return v;
    }

    vec2 rotate(vec2 p, float a) {
      float c = cos(a), s = sin(a);
      return mat2(c, -s, s, c) * p;
    }

    float domainWarp(vec2 p, out vec2 q, out vec2 r, float t) {
      q.x = fbm(p + vec2(t * 0.05, -t * 0.04));
      q.y = fbm(p + vec2(4.2, 1.8) + vec2(-t * 0.042, t * 0.046));

      r.x = fbm(p + 2.8 * q + vec2(1.7, 9.2) + vec2(t * 0.06, t * 0.03));
      r.y = fbm(p + 2.8 * q + vec2(8.3, 2.8) + vec2(-t * 0.035, -t * 0.055));

      return fbm(p + 3.2 * r + vec2(t * 0.025, t * 0.035));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

      // Velocità calibrata al 55%
      float speed = u_flight_speed;
      float t = u_time * 0.22 * speed;

      // --- FISICA DI VOLO: 3D FORWARD PROGRESSION ---
      vec2 p;
      if (u_flight_mode < 0.5) {
        float rCoord = length(uv);
        float zDepth = max(0.12, rCoord);
        vec2 dir = normalize(uv);
        p = dir * (log(zDepth * 3.5 + 1.0) * 1.6 - t * 0.45) + rotate(uv, sin(t * 0.08) * 0.2) * 1.8;
      } else {
        vec2 mouseParallax = u_mouse * 0.45;
        p = uv * 2.2 + vec2(t * 0.16, t * 0.09) + mouseParallax;
      }

      // Aura fotonica soffusa del mouse
      float dMouse = length(uv - u_mouse);
      float mouseSoftAura = exp(-dMouse * 3.4) * u_mouse_hover;
      p += (uv - u_mouse) * mouseSoftAura * 0.09;

      // Calcolo fluido del plasma con Domain Warping
      vec2 q, r;
      float f = domainWarp(p, q, r, t);

      // --- COLORAZIONE CASUALE: ACCENSIONE ORGANICA A ZONE ---
      vec3 colNebula1, colNebula2, colNebula3;

      if (u_color_mode < 0.5) {
        float rndPhase1 = sin(u_time * 0.24 + noise(vec2(u_time * 0.05, 1.4)) * 3.0) * 0.5 + 0.5;
        float rndPhase2 = cos(u_time * 0.19 + noise(vec2(u_time * 0.04, 5.8)) * 3.0) * 0.5 + 0.5;
        float rndPhase3 = sin(u_time * 0.31 + noise(vec2(u_time * 0.06, 9.2)) * 3.0) * 0.5 + 0.5;

        colNebula1 = mix(C_VIOLET, C_BLUE, rndPhase1);
        colNebula2 = mix(C_BLUE, C_CYAN, rndPhase2);
        colNebula3 = mix(C_CYAN, C_SOFTCYAN, rndPhase3);

        float magentaPulse = pow(smoothstep(0.66, 0.95, length(q)), 2.8) * (sin(u_time * 0.4) * 0.5 + 0.5);
        colNebula1 = mix(colNebula1, C_MAGENTA, magentaPulse * 0.35);
      } else {
        // ACCENSIONE ORGANICA A ZONE
        float waveTime = u_time * (0.06 + speed * 0.45);
        float zone1 = smoothstep(0.25, 0.82, fbm(p * 0.8 + vec2(waveTime * 0.12, -waveTime * 0.09)));
        float zone2 = smoothstep(0.30, 0.85, fbm(p * 0.8 + vec2(4.5 - waveTime * 0.10, 2.1 + waveTime * 0.14)));
        float zone3 = smoothstep(0.35, 0.88, fbm(p * 1.1 + vec2(8.1 + waveTime * 0.08, -3.2 + waveTime * 0.06)));

        float wave1 = sin(waveTime * 1.2 + zone1 * 3.5) * 0.5 + 0.5;
        float wave2 = cos(waveTime * 1.0 + zone2 * 3.5) * 0.5 + 0.5;
        float wave3 = sin(waveTime * 1.4 + zone3 * 4.0) * 0.5 + 0.5;

        colNebula1 = mix(C_VIOLET, C_BLUE, wave1);
        colNebula2 = mix(C_BLUE, C_CYAN, wave2);
        colNebula3 = mix(C_CYAN, C_MAGENTA, wave3 * 0.45);
      }

      // Densità volumetrica del gas cosmico
      float density1 = smoothstep(0.18, 0.78, f);
      float density2 = smoothstep(0.38, 0.88, length(r));
      float coreGlow = smoothstep(0.55, 0.95, f);

      // Composizione cromatica
      vec3 col = C_VOID;
      col += colNebula1 * density1 * 0.48;
      col += colNebula2 * density2 * 0.42;
      col += colNebula3 * coreGlow * 0.56;

      // Bagliore centrale di respiro galattico
      float centerGlow = exp(-dot(uv, uv) * 3.8) * (0.85 + 0.15 * sin(t * 0.8));
      col += colNebula2 * centerGlow * 0.22;

      // --- CAMPO STELLARE 3D PROSPETTICO ---
      if (u_flight_mode < 0.5) {
        // 3 LIVELLI DI STELLE CHE AVANZANO VERSO LO SCHERMO
        float z1 = fract(0.33 - u_time * 0.12 * speed);
        vec2 sp1 = uv * (0.35 / max(0.04, z1)) + vec2(3.17, 7.43);
        vec2 c1 = floor(sp1);
        float h1 = hash21(c1);
        if (h1 > 0.965) {
          float tw1 = sin(u_time * 4.0 + h1 * 50.0) * 0.5 + 0.5;
          float sAlpha1 = smoothstep(0.065, 0.0, length(fract(sp1) - 0.5)) * (1.0 - z1) * (0.35 + 0.65 * tw1);
          col += mix(C_SOFTCYAN, C_WHITE, tw1) * sAlpha1 * 0.75;
        }

        float z2 = fract(0.66 - u_time * 0.08 * speed);
        vec2 sp2 = uv * (0.35 / max(0.04, z2)) + vec2(6.34, 14.86);
        vec2 c2 = floor(sp2);
        float h2 = hash21(c2);
        if (h2 > 0.970) {
          float tw2 = cos(u_time * 3.5 + h2 * 40.0) * 0.5 + 0.5;
          float sAlpha2 = smoothstep(0.060, 0.0, length(fract(sp2) - 0.5)) * (1.0 - z2) * (0.3 + 0.7 * tw2);
          col += mix(C_CYAN, C_WHITE, tw2) * sAlpha2 * 0.65;
        }

        float z3 = fract(0.99 - u_time * 0.05 * speed);
        vec2 sp3 = uv * (0.35 / max(0.04, z3)) + vec2(9.51, 22.29);
        vec2 c3 = floor(sp3);
        float h3 = hash21(c3);
        if (h3 > 0.975) {
          float tw3 = sin(u_time * 5.0 + h3 * 30.0) * 0.5 + 0.5;
          float sAlpha3 = smoothstep(0.055, 0.0, length(fract(sp3) - 0.5)) * (1.0 - z3) * (0.25 + 0.75 * tw3);
          col += C_WHITE * sAlpha3 * 0.55;
        }
      }

      // --- AURA LUMINOSA SOFFUSA DEL CURSORE (SOFT VERI SOFT) ---
      if (u_mouse_hover > 0.005) {
        float auraCore = exp(-dMouse * 11.0) * 0.16;
        float auraMid  = exp(-dMouse * 3.8) * 0.11;
        float auraWide = exp(-dMouse * 1.5) * 0.055;

        vec3 auraColor = C_WHITE * auraCore * 0.65 +
                         C_SOFTCYAN * auraMid * 0.85 +
                         colNebula2 * auraWide;

        col += auraColor * u_mouse_hover;
      }

      // Vignettatura cinematica perimetrale
      float rimVignette = smoothstep(0.22, 0.96, length(uv));
      col = mix(col, col * 0.72, rimVignette);

      // Filmic tone mapping & gamma curve
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
  const uFlightMode = gl.getUniformLocation(program, 'u_flight_mode');
  const uColorMode = gl.getUniformLocation(program, 'u_color_mode');
  const uFlightSpeed = gl.getUniformLocation(program, 'u_flight_speed');

  const mouse = {
    x: 0, y: 0,
    tx: 0, ty: 0,
    hover: 0,
    targetHover: 0
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const px = e.clientX * dpr;
    const py = (window.innerHeight - e.clientY) * dpr;
    mouse.tx = (px - 0.5 * canvasW) / canvasH;
    mouse.ty = (py - 0.5 * canvasH) / canvasH;
    mouse.targetHover = 1.0;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    mouse.targetHover = 0.0;
  });

  window.addEventListener('pointerenter', () => {
    mouse.targetHover = 1.0;
  });

  // Gestione Risparmio Energetico (Pausa quando il tab è nascosto)
  let isVisible = true;
  document.addEventListener('visibilitychange', () => {
    isVisible = (document.visibilityState === 'visible');
    if (isVisible) {
      requestAnimationFrame(render);
    }
  });

  function render(ms) {
    if (!isVisible) return;

    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    mouse.hover += (mouse.targetHover - mouse.hover) * 0.05;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, ms * 0.001);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uMouseHover, mouse.hover);
    gl.uniform1f(uFlightMode, CONFIG.flightMode);
    gl.uniform1f(uColorMode, CONFIG.colorMode);
    gl.uniform1f(uFlightSpeed, CONFIG.flightSpeed);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
