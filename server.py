#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGOS Image App — Server zero-dipendenze
Modello: letto da .env (LLMAPI_IMAGE_MODEL) — nessun nome hardcoded
Chiave: LLMAPI_API_KEY nel file .env

Avvio:  python server.py
URL:    http://127.0.0.1:8300

API: il modello accetta il parametro 'ratio' (es. 9:16, 1:1, 16:9).
Il parametro 'size' NON è supportato (dimensione automatica dal modello).
"""

import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# Safe Unicode output on Windows cp1252 consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from image_router import ImageRouter

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ENV_FILE = BASE_DIR / ".env"

MAX_PROMPT_CHARS = 4000
MAX_PAYLOAD_BYTES = 20_000_000

# Ratio supportate dal modello (verificate via debug)
SUPPORTED_RATIOS = {"9:16", "16:9", "1:1", "4:5", "3:4", "21:9", "2:3", "3:2"}
DEFAULT_RATIO = "1:1"

# Modelli che usano /images/generations (image generation API)
IMAGE_GEN_MODELS = {
    "qwen-image-max-2025-12-30",
    "gemini-3-pro-image",
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash",
}

# Modelli che non supportano il parametro 'n' (numero immagini)
MODELS_NO_N_PARAM = {
    "gemini-3-pro-image",
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash",
}

# Modelli che usano /chat/completions (multimodal chat API)
CHAT_IMAGE_MODELS = {
    "dola-seedream-5-0-pro-260628",
}


def load_env() -> dict:
    """Carica variabili da .env (senza dipendenze esterne)."""
    env = {}
    if not ENV_FILE.exists():
        return env
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def get_config() -> tuple:
    """Ritorna (base_url, api_key, model, port, available_models). Env di sistema > .env.

    Il modello NON ha fallback hardcoded: se manca in .env, ritorna stringa vuota
    e l'API risponderà con errore chiaro.
    """
    env = load_env()
    base = os.environ.get("LLMAPI_BASE_URL") or env.get("LLMAPI_BASE_URL", "https://api.llmapi.ai/v1")
    key = os.environ.get("LLMAPI_API_KEY") or env.get("LLMAPI_API_KEY", "")
    model = os.environ.get("LLMAPI_IMAGE_MODEL") or env.get("LLMAPI_IMAGE_MODEL", "")
    available = (os.environ.get("LLMAPI_AVAILABLE_MODELS") or env.get("LLMAPI_AVAILABLE_MODELS", "")).strip()
    available_models = [m.strip() for m in available.split(",") if m.strip()] if available else []
    try:
        port = int(os.environ.get("PORT") or env.get("PORT", "8300"))
    except ValueError:
        port = 8300
    return base.rstrip("/"), key.strip(), model.strip(), port, available_models


# Istanza globale di ImageRouter per gestione multi-provider e fallback
router = ImageRouter(env_loader_fn=load_env)


def get_model_api_type(model: str) -> str:
    """Determina quale API usare per il modello."""
    if model in IMAGE_GEN_MODELS:
        return "images"
    if model in CHAT_IMAGE_MODELS:
        return "chat"
    # Default: prova images/generations
    return "images"


RATIO_PROMPTS = {
    "9:16": "vertical portrait orientation, tall aspect ratio 9:16, optimized for mobile stories and TikTok, full height composition, height much greater than width, smartphone screen format --ar 9:16",
    "16:9": "cinematic wide shot, 16:9 aspect ratio, horizontal composition, panoramic view, width much greater than height, ultra-wide angle lens, 1920x1080 resolution style, landscape orientation --ar 16:9",
    "4:5": "vertical portrait 4:5 aspect ratio, Instagram post format, tall composition, height greater than width --ar 4:5",
    "1:1": "square composition 1:1 aspect ratio, balanced symmetrical framing, equal width and height --ar 1:1",
    "3:4": "vertical portrait 3:4 aspect ratio, classic photography format, height greater than width --ar 3:4",
    "2:3": "vertical portrait 2:3 aspect ratio, standard photo print format, height greater than width --ar 2:3",
    "3:2": "horizontal landscape 3:2 aspect ratio, classic 35mm photography format, width greater than height --ar 3:2",
    "21:9": "ultra-wide cinematic 21:9 aspect ratio, anamorphic widescreen composition, extreme horizontal panoramic --ar 21:9",
}

def enhance_prompt_with_ratio(prompt: str, ratio: str) -> str:
    """Aggiunge istruzioni esplicite per il ratio al prompt."""
    if ratio in RATIO_PROMPTS:
        return f"{prompt}, {RATIO_PROMPTS[ratio]}"
    return prompt


def call_image_api(prompt: str, quality: str = "auto", ratio: str = DEFAULT_RATIO, width: int = None, height: int = None, model: str = None, image_data: str = None) -> dict:
    """Chiama endpoint LLMAPI appropriato per il modello."""
    prompt = enhance_prompt_with_ratio(prompt, ratio)
    base, key, default_model, _, _ = get_config()
    model = model or default_model
    if not key:
        return {"error": "Chiave API mancante. Aggiungi LLMAPI_API_KEY nel file IMAGE_APP/.env", "status": 400}
    if not model:
        return {"error": "Modello mancante. Aggiungi LLMAPI_IMAGE_MODEL nel file IMAGE_APP/.env", "status": 400}

    if ratio not in SUPPORTED_RATIOS:
        ratio = DEFAULT_RATIO

    api_type = get_model_api_type(model)

    if api_type == "chat":
        return call_chat_image_api(prompt, model, base, key, image_data=image_data)
    else:
        return call_images_generations_api(prompt, quality, ratio, width, height, model, base, key, image_data=image_data)


def call_images_generations_api(prompt: str, quality: str, ratio: str, width: int, height: int, model: str, base: str, key: str, image_data: str = None) -> dict:
    """Chiama endpoint LLMAPI /images/generations (Qwen, Flash Image, etc.)."""
    print(f"[DEBUG] call_images_generations_api model={model}, MODELS_NO_N_PARAM={MODELS_NO_N_PARAM}")
    endpoint = f"{base}/images/generations"
    payload = {
        "model": model,
        "prompt": prompt,
        "ratio": ratio,
    }
    if image_data:
        payload["image"] = image_data
    if model not in MODELS_NO_N_PARAM:
        payload["n"] = 1
    if quality in ("high", "low"):
        payload["quality"] = quality
    if width is not None:
        payload["width"] = width
    if height is not None:
        payload["height"] = height

    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(endpoint, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("User-Agent", "AGOS-ImageApp/1.0")

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="replace")
        return {"error": f"LLMAPI HTTP {err.code}: {err_body[:500]}", "status": err.code}
    except Exception as err:
        return {"error": f"Errore di connessione: {str(err)[:300]}", "status": 502}

    items = data.get("data") or []
    if not items:
        msg = data.get("error") or data.get("message") or "Risposta senza dati immagine"
        return {"error": f"LLMAPI: {msg}", "details": str(data)[:400], "status": 502}

    first = items[0] if isinstance(items, list) else items
    meta = {
        "output_format": data.get("output_format"),
        "quality": data.get("quality"),
        "size": data.get("size"),
        "ratio": ratio,
    }
    if isinstance(first, dict):
        if first.get("url"):
            result = {"image_url": first["url"], "status": 200}
            result["meta"] = {k: v for k, v in meta.items() if v}
            return result
        if first.get("b64_json"):
            result = {"b64_json": first["b64_json"], "status": 200}
            result["meta"] = {k: v for k, v in meta.items() if v}
            return result
        return {"error": "Formato risposta non riconosciuto", "details": str(data)[:400], "status": 502}

    return {"error": "Formato risposta non valido", "status": 502}


def call_chat_image_api(prompt: str, model: str, base: str, key: str, image_data: str = None) -> dict:
    """Chiama endpoint LLMAPI /chat/completions per modelli multimodali (Seedream, etc.)."""
    endpoint = f"{base}/chat/completions"
    if image_data:
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data}}
        ]
    else:
        user_content = prompt

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": user_content}
        ],
        "max_tokens": 4000,
        "temperature": 0.7,
    }

    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(endpoint, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("User-Agent", "AGOS-ImageApp/1.0")

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        err_body = err.read().decode("utf-8", errors="replace")
        return {"error": f"LLMAPI HTTP {err.code}: {err_body[:500]}", "status": err.code}
    except Exception as err:
        return {"error": f"Errore di connessione: {str(err)[:300]}", "status": 502}

    # Estrae URL immagine dalla risposta chat
    choices = data.get("choices") or []
    if not choices:
        return {"error": "Risposta chat senza choices", "details": str(data)[:400], "status": 502}

    message = choices[0].get("message", {})
    content = message.get("content", "")
    tool_calls = message.get("tool_calls") or []

    # Prova a estrarre URL da tool_calls (formato function calling per generazione immagini)
    for tc in tool_calls:
        func = tc.get("function", {})
        if func.get("name") in ("generate_image", "create_image", "image_generation"):
            try:
                args = json.loads(func.get("arguments", "{}"))
                if args.get("url"):
                    return {"image_url": args["url"], "status": 200, "meta": {"model": model}}
            except:
                pass

    # Prova a trovare URL nel content (markdown o JSON)
    import re
    urls = re.findall(r'https?://[^\s\)"]+\.(?:png|jpg|jpeg|webp|gif)', content)
    if urls:
        return {"image_url": urls[0], "status": 200, "meta": {"model": model}}

    # Fallback: restituisce il testo se non trova immagine
    return {"error": "Nessuna immagine generata dal modello chat", "details": content[:500], "status": 502}


class Handler(BaseHTTPRequestHandler):
    """HTTP handler per file statici + API."""

    def log_message(self, fmt, *args):
        sys.stderr.write("[AGOS Image App] %s\n" % (fmt % args))

    def _send_json(self, obj: dict, status: int = 200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _serve_static(self, path: str):
        if path in ("/", "/index.html"):
            file_path = STATIC_DIR / "index.html"
            content_type = "text/html; charset=utf-8"
        else:
            rel = path.lstrip("/")
            if rel.startswith("static/"):
                rel = rel[len("static/"):]
            file_path = STATIC_DIR / rel
            content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"

        try:
            resolved = file_path.resolve()
            static_root = STATIC_DIR.resolve()
            if not resolved.is_file() or not str(resolved).startswith(str(static_root)):
                raise FileNotFoundError
            body = resolved.read_bytes()
        except (FileNotFoundError, OSError):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/status", "/api/status"):
            base, key, model, port, available_models = get_config()
            env = load_env()
            gemini_configured = bool(env.get("GEMINI_API_KEY"))
            agnes_configured = bool(env.get("AGNESAI_API_KEY") or env.get("AGNESAI_API_KEI"))
            self._send_json({
                "key_configured": bool(key),
                "gemini_configured": gemini_configured,
                "agnes_configured": agnes_configured,
                "model": model,
                "base_url": base,
                "port": port,
                "available_models": available_models,
                "router_enabled": True,
            })
            return
        if clean_path in ("/models", "/api/models"):
            models_info = [
                {
                    "id": "auto-router",
                    "name": "🔀 Smart Router (Free)",
                    "credits": 0,
                    "tier": "free",
                    "badge": "0 crediti",
                    "desc": "Switch automatico sul miglior provider gratuito ad alta fedeltà"
                },
                {
                    "id": "gemini-2.5-flash",
                    "name": "⚡ Google Gemini 3.1 Flash (50 crediti)",
                    "credits": 50,
                    "tier": "premium",
                    "badge": "50 crediti",
                    "desc": "Fotorealismo Ultra-HD da PosterLab Pro con character consistency"
                },
                {
                    "id": "agnes-image-2.5-flash",
                    "name": "🎨 Agnes Background & Texture (Free)",
                    "credits": 0,
                    "tier": "free",
                    "badge": "0 crediti",
                    "desc": "Texture astratte, pattern e sfondi grafici senza testo, pronti come canvas per PosterLab"
                },
                {
                    "id": "qwen-image-max-2025-12-30",
                    "name": "🎨 Qwen Image Max (Free)",
                    "credits": 0,
                    "tier": "free",
                    "badge": "0 crediti",
                    "desc": "Modello ad alta risoluzione per illustrazioni e concept poster"
                }
            ]
            self._send_json({
                "models": [m["id"] for m in models_info],
                "models_detailed": models_info,
                "default": "auto-router",
            })
            return
        self._serve_static(self.path)

    def do_POST(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/api/generate", "/generate"):
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length > MAX_PAYLOAD_BYTES:
                    self._send_json({"error": "Payload troppo grande"}, 413)
                    return
                raw = self.rfile.read(length)
                body = json.loads(raw.decode("utf-8"))
            except Exception:
                self._send_json({"error": "JSON non valido"}, 400)
                return

            prompt = (body.get("prompt") or "").strip()
            if not prompt:
                self._send_json({"error": "Prompt mancante"}, 400)
                return
            if len(prompt) > MAX_PROMPT_CHARS:
                self._send_json({"error": f"Prompt troppo lungo (max {MAX_PROMPT_CHARS} caratteri)"}, 400)
                return

            quality = (body.get("quality") or "auto").strip()
            if quality not in ("auto", "high", "low"):
                quality = "auto"

            ratio = (body.get("ratio") or DEFAULT_RATIO).strip()
            if ratio not in SUPPORTED_RATIOS:
                ratio = DEFAULT_RATIO

            model = (body.get("model") or "").strip()
            if model and model not in (IMAGE_GEN_MODELS | CHAT_IMAGE_MODELS):
                # Permette modelli non nella lista ma logga warning
                pass

            width = body.get("width")
            height = body.get("height")
            if width is not None:
                try:
                    width = int(width)
                except (ValueError, TypeError):
                    width = None
            if height is not None:
                try:
                    height = int(height)
                except (ValueError, TypeError):
                    height = None

            image = body.get("image")

            # Esecuzione tramite ImageRouter con auto-switch e fallback
            result = router.generate(
                prompt=prompt,
                quality=quality,
                ratio=ratio,
                width=width,
                height=height,
                requested_model=model or "auto-router",
                image=image
            )
            status = result.pop("status", 200 if result.get("ok", True) else 502)
            self._send_json(result, status)
            return

        self._send_json({"error": "Endpoint non trovato"}, 404)


def main():
    base, key, model, port, available_models = get_config()
    banner = "=" * 64
    print(banner)
    print("  ✦ AGOS PICT STUDIO — Creative Visual Playground & Style Engine")
    print("  Ecosistema AGOS · Versione 2.4.0 (Multi-Provider)")
    print(banner)
    print(f"  URL Locale : http://127.0.0.1:{port}")
    print(f"  Gemini Pro : Google Gemini 3.1 Flash (50 crediti)")
    print(f"  Agnes Lab  : Agnes Background Studio (0 crediti - Free)")
    print(f"  Router     : Smart Router Free (Qwen Image Max + Agnes)")
    print(f"  Ratio MIT  : {', '.join(sorted(SUPPORTED_RATIOS))}")
    print(banner)
    print("  Premi Ctrl+C per arrestare il server.\n")

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArresto in corso...")
        server.server_close()
        print("Server fermato.")


if __name__ == "__main__":
    main()
