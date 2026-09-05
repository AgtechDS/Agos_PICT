#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Image Router per AGOS Image Studio (IMAGE_APP)
Gestisce routing multi-provider ad alta qualità con auto-switch, circuit breaker,
specializzazione sfondi Agnes e gestione aspect-ratio di precisione (MIT-grade standard).

Provider supportati:
1. Google Gemini 3.1 Flash Image (Engine nativo PosterLab via LLMAPI/Direct) — 50 crediti
2. Agnes AI Hub (agnes-image-2.5-flash: Background & Texture Studio) — 100% Free (0 crediti)
3. LLMAPI (Qwen Image Max 2025) — 100% Free
"""

import base64
import json
import os
import random
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = BASE_DIR / "static" / "outputs"
try:
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Dimensioni di riferimento matematiche per i diversi aspect ratio (MIT-grade standard)
RATIO_DIMS = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "4:5": (864, 1080),
    "3:4": (768, 1024),
    "2:3": (720, 1080),
    "3:2": (1080, 720),
    "21:9": (1344, 576),
}


def get_dimensions(ratio: str, custom_w: int = None, custom_h: int = None) -> tuple[int, int]:
    """Determina larghezza e altezza in base al ratio o ai valori custom."""
    if custom_w and custom_h:
        return (custom_w, custom_h)
    return RATIO_DIMS.get(ratio, (1024, 1024))


def enforce_aspect_ratio(target_path: Path, ratio: str, target_w: int = None, target_h: int = None) -> tuple[int, int]:
    """
    Enforcement Aspect-Ratio ad alta precisione (MIT-grade standard).
    Verifica che il file immagine memorizzato su disco rispetti l'aspect ratio target
    con tolleranza analitica < 1.5%. Se l'output del provider diverge (es. modello quadrato nativo),
    esegue un center-crop simmetrico ad altissima fedeltà con Pillow preservando la risoluzione
    e la nitidezza del soggetto/texture.
    """
    try:
        from PIL import Image
        if not target_w or not target_h:
            target_w, target_h = get_dimensions(ratio)
        target_aspect = target_w / target_h

        with Image.open(target_path) as im:
            src_w, src_h = im.size
            src_aspect = src_w / src_h

            # Se il ratio reale rientra nella tolleranza dell'1.5%, manteniamo i pixel originali
            if abs(src_aspect - target_aspect) / target_aspect <= 0.015:
                return src_w, src_h

            # Center-crop simmetrico
            if src_aspect > target_aspect:
                # Immagine troppo larga: ritaglio orizzontale
                crop_w = int(round(src_h * target_aspect))
                x0 = (src_w - crop_w) // 2
                box = (x0, 0, x0 + crop_w, src_h)
            else:
                # Immagine troppo alta: ritaglio verticale
                crop_h = int(round(src_w / target_aspect))
                y0 = (src_h - crop_h) // 2
                box = (0, y0, src_w, y0 + crop_h)

            cropped = im.crop(box)
            ext = target_path.suffix.lower().replace(".", "")
            if ext in ("jpg", "jpeg"):
                cropped.save(target_path, format="JPEG", quality=96, optimize=True)
            else:
                cropped.save(target_path, format="PNG", optimize=True)
            print(f"[RATIO-ENGINE] Applicato crop MIT-grade: {src_w}x{src_h} -> {cropped.size[0]}x{cropped.size[1]} (ratio {ratio})")
            return cropped.size
    except Exception as e:
        print(f"[WARN] Impossibile applicare crop aspect-ratio su {target_path}: {e}")
        return target_w or 1024, target_h or 1024


def save_image_bytes(data: bytes, ext: str = "png", prefix: str = "img", ratio: str = None, target_w: int = None, target_h: int = None) -> tuple[str, int, int]:
    """Salva i bytes su disco locale, applica aspect-ratio check e restituisce (url, w, h).
    In ambiente serverless (Vercel) o read-only, restituisce un data-URI base64."""
    if os.environ.get("VERCEL") or not os.access(str(BASE_DIR), os.W_OK):
        mime = "image/jpeg" if ext in ("jpg", "jpeg") else ("image/webp" if ext == "webp" else "image/png")
        data_uri = f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"
        return data_uri, target_w or 1024, target_h or 1024

    timestamp = int(time.time() * 1000)
    rand_suffix = random.randint(1000, 9999)
    filename = f"{prefix}_{timestamp}_{rand_suffix}.{ext}"
    target_path = OUTPUTS_DIR / filename
    try:
        OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(data)
        final_w, final_h = (target_w or 1024, target_h or 1024)
        if ratio:
            final_w, final_h = enforce_aspect_ratio(target_path, ratio, target_w, target_h)
        return f"/outputs/{filename}", final_w, final_h
    except Exception as err:
        print(f"[WARN] Scrittura su disco non riuscita ({err}). Ritorno data-URI.")
        mime = "image/jpeg" if ext in ("jpg", "jpeg") else ("image/webp" if ext == "webp" else "image/png")
        data_uri = f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"
        return data_uri, target_w or 1024, target_h or 1024


def download_and_save_image(url: str, prefix: str = "img", ratio: str = None, target_w: int = None, target_h: int = None) -> tuple[str, int, int]:
    """Scarica un'immagine remota, la memorizza in locale e applica aspect-ratio check.
    In ambiente serverless (Vercel), restituisce direttamente l'URL remoto."""
    if os.environ.get("VERCEL"):
        return url, (target_w or 1024), (target_h or 1024)

    req = urllib.request.Request(url, headers={"User-Agent": "AGOS-ImageApp/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            content_type = resp.headers.get("Content-Type", "")
            ext = "png"
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            elif "webp" in content_type:
                ext = "webp"
            body = resp.read()
            return save_image_bytes(body, ext=ext, prefix=prefix, ratio=ratio, target_w=target_w, target_h=target_h)
    except Exception as e:
        print(f"[WARN] Impossibile scaricare immagine da {url[:60]}: {e}. Uso URL originale.")
        return url, (target_w or 1024), (target_h or 1024)


def save_reference_image(data_str: str) -> str:
    """Salva su disco un'immagine di riferimento o restituisce il data-URL in ambiente serverless."""
    if not data_str:
        return ""
    if os.environ.get("VERCEL") or not os.access(str(BASE_DIR), os.W_OK):
        return data_str

    ext = "png"
    encoded = data_str
    if "," in data_str:
        header, encoded = data_str.split(",", 1)
        if "jpeg" in header or "jpg" in header:
            ext = "jpg"
        elif "webp" in header:
            ext = "webp"
    try:
        raw = base64.b64decode(encoded)
        url, _, _ = save_image_bytes(raw, ext=ext, prefix="ref")
        return url
    except Exception as e:
        print(f"[WARN] Impossibile decodificare immagine di riferimento: {e}")
        return data_str


class ImageRouter:
    """Router intelligente multi-provider con circuit breaker e precision ratio engine."""

    def __init__(self, env_loader_fn=None):
        self.env_loader_fn = env_loader_fn
        # Dizionario cooldown: { provider_name: expire_epoch }
        self.cooldowns: dict[str, float] = {}

    def _get_env(self) -> dict:
        merged = dict(os.environ)
        if self.env_loader_fn:
            try:
                loaded = self.env_loader_fn()
                if loaded:
                    for k, v in loaded.items():
                        if k not in merged or not merged[k]:
                            merged[k] = v
            except Exception:
                pass
        return merged

    def is_in_cooldown(self, provider: str) -> bool:
        """Verifica se un provider è temporaneamente disabilitato per rate limit o errori."""
        expire = self.cooldowns.get(provider, 0)
        return time.time() < expire

    def set_cooldown(self, provider: str, seconds: float = 60.0):
        """Imposta periodo di cooldown per un provider dopo un errore 429/timeout."""
        self.cooldowns[provider] = time.time() + seconds
        print(f"[ROUTER] Provider '{provider}' in cooldown per {seconds}s.")


    # -------------------------------------------------------------
    # ADAPTER 2: LLMAPI (Qwen Image Max, Gemini Image, Seedream)
    # -------------------------------------------------------------
    def call_llmapi_adapter(self, prompt: str, quality: str, ratio: str, width: int, height: int, model: str = None, image_data: str = None) -> dict:
        import server
        base, key, default_model, _, _ = server.get_config()
        chosen_model = model or default_model
        if not key:
            return {"ok": False, "error": "LLMAPI_API_KEY non configurata in .env", "code": "NO_KEY"}

        res = server.call_image_api(prompt, quality=quality, ratio=ratio, width=width, height=height, model=chosen_model, image_data=image_data)
        status = res.get("status", 200)
        if status != 200 or "error" in res:
            err_msg = res.get("error", "Errore sconosciuto LLMAPI")
            if "429" in str(err_msg):
                self.set_cooldown("llmapi", seconds=90)
            return {"ok": False, "error": err_msg, "code": status}

        img_url = res.get("image_url")
        b64 = res.get("b64_json")
        is_gemini = "gemini" in chosen_model.lower()
        provider_title = "Google Gemini 3.1 Flash (PosterLab Engine)" if is_gemini else f"LLMAPI ({chosen_model})"

        if img_url:
            local_url, act_w, act_h = download_and_save_image(
                img_url, prefix="llmapi", ratio=ratio, target_w=width, target_h=height
            )
            meta = dict(res.get("meta", {}))
            meta.update({
                "ratio": ratio,
                "size": f"{act_w}x{act_h}",
                "aspect_ratio": round(act_w / act_h, 4)
            })
            return {
                "ok": True,
                "image_url": local_url,
                "provider": provider_title,
                "model": chosen_model,
                "meta": meta,
            }
        elif b64:
            raw_bytes = base64.b64decode(b64)
            prefix = "gemini_flash" if is_gemini else "llmapi_b64"
            local_url, act_w, act_h = save_image_bytes(
                raw_bytes, ext="png", prefix=prefix, ratio=ratio, target_w=width, target_h=height
            )
            meta = dict(res.get("meta", {}))
            meta.update({
                "ratio": ratio,
                "size": f"{act_w}x{act_h}",
                "aspect_ratio": round(act_w / act_h, 4)
            })
            return {
                "ok": True,
                "image_url": local_url,
                "provider": provider_title,
                "model": chosen_model,
                "meta": meta,
            }

        return {"ok": False, "error": "Nessuna immagine valida restituita da LLMAPI", "code": 502}

    # -------------------------------------------------------------
    # ADAPTER 3: Google Gemini Flash (PosterLab Direct + LLMAPI Engine)
    # -------------------------------------------------------------
    def call_gemini_flash(self, prompt: str, ratio: str, width: int, height: int, image_data: str = None) -> dict:
        env = self._get_env()
        llm_key = env.get("LLMAPI_API_KEY")
        gemini_key = env.get("GEMINI_API_KEY")

        # 1. Tentativo Primario: Gemini 3.1 Flash Image Preview via LLMAPI (Motore nativo PosterLab Pro)
        if llm_key and not self.is_in_cooldown("llmapi_gemini"):
            print("[ROUTER] Chiamata diretta Google Gemini 3.1 Flash Image Preview (PosterLab Engine)...")
            res_llm = self.call_llmapi_adapter(
                prompt,
                quality="high",
                ratio=ratio,
                width=width,
                height=height,
                model="gemini-3.1-flash-image-preview",
                image_data=image_data
            )
            if res_llm.get("ok"):
                res_llm["provider"] = "Google Gemini 3.1 Flash (PosterLab Engine)"
                res_llm["model"] = "gemini-3.1-flash"
                res_llm.setdefault("meta", {})["engine"] = "posterlab-native"
                return res_llm
            print(f"[ROUTER] Gemini 3.1 Flash su LLMAPI non riuscito: {res_llm.get('error')}")

        # 2. Tentativo Secondario: Google AI Studio Diretto (se configurato)
        if gemini_key and not self.is_in_cooldown("gemini_direct"):
            model_name = "gemini-2.5-flash-image"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            parts = [{"text": f"{prompt}. Aspect ratio: {ratio}, resolution: {width}x{height}."}]
            if image_data:
                b64_clean = image_data.split(",", 1)[1] if "," in image_data else image_data
                parts.append({
                    "inlineData": {
                        "mimeType": "image/png",
                        "data": b64_clean
                    }
                })

            payload = {"contents": [{"parts": parts}]}
            body = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=body, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("User-Agent", "AGOS-PosterLab-Gemini/1.0")

            try:
                with urllib.request.urlopen(req, timeout=90) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for p in parts:
                            if "inlineData" in p:
                                img_b64 = p["inlineData"].get("data", "")
                                mime = p["inlineData"].get("mimeType", "image/png")
                                ext = "jpg" if "jpeg" in mime or "jpg" in mime else "png"
                                raw = base64.b64decode(img_b64)
                                local_url, act_w, act_h = save_image_bytes(
                                    raw, ext=ext, prefix="gemini_flash", ratio=ratio, target_w=width, target_h=height
                                )
                                return {
                                    "ok": True,
                                    "image_url": local_url,
                                    "provider": "Google Gemini 2.5 Flash (AI Studio Direct)",
                                    "model": "gemini-2.5-flash",
                                    "meta": {
                                        "ratio": ratio,
                                        "size": f"{act_w}x{act_h}",
                                        "aspect_ratio": round(act_w / act_h, 4),
                                        "source": "gemini_direct"
                                    },
                                }
            except urllib.error.HTTPError as err:
                err_text = err.read().decode("utf-8", errors="replace")
                print(f"[ROUTER] Gemini Direct HTTP {err.code}: {err_text[:200]}")
                if err.code == 429:
                    self.set_cooldown("gemini_direct", seconds=90)
            except Exception as exc:
                print(f"[ROUTER] Gemini Direct Error: {exc}")

        return {"ok": False, "error": "Generazione con Google Gemini non riuscita. Servizio temporaneamente non disponibile.", "code": 502}

    # -------------------------------------------------------------
    # ADAPTER 4: Agnes AI Hub — Background & Texture Studio (100% Free)
    # Specializzato in: Sfondi grafici, texture e wallpaper senza testo e senza soggetti
    # -------------------------------------------------------------
    def call_agnes(self, prompt: str, ratio: str, width: int, height: int, model: str = "agnes-image-2.5-flash") -> dict:
        env = self._get_env()
        key = env.get("AGNESAI_API_KEY") or env.get("AGNESAI_API_KEI")
        base_url = env.get("AGNESAI_BASE_URL", "https://apihub.agnes-ai.com/v1").rstrip("/")
        if not key:
            return {"ok": False, "error": "AGNESAI_API_KEY non configurata in .env", "code": "NO_KEY"}

        # Direttiva specializzata: Solo sfondi grafici e texture per poster design, zero testo, zero facce
        bg_directive = (
            "abstract graphic background, atmospheric texture canvas for poster design, artistic backdrop wallpaper, "
            "no text, no letters, no typography, no human faces, no persons, clean background canvas"
        )
        agnes_prompt = f"{prompt}. {bg_directive}"

        url = f"{base_url}/images/generations"
        payload = {
            "model": model or "agnes-image-2.5-flash",
            "prompt": agnes_prompt,
            "n": 1,
            "size": f"{width}x{height}" if width and height else "1024x1024"
        }
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, method="POST")
        req.add_header("Authorization", f"Bearer {key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("User-Agent", "AGOS-AgnesAI/1.0")

        ctx = ssl._create_unverified_context()
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("data", [])
                if items and items[0].get("url"):
                    remote_url = items[0]["url"]
                    local_url, act_w, act_h = download_and_save_image(
                        remote_url, prefix="agnes_bg", ratio=ratio, target_w=width, target_h=height
                    )
                    return {
                        "ok": True,
                        "image_url": local_url,
                        "provider": "Agnes Background Studio (Free)",
                        "model": "agnes-image-2.5-flash",
                        "meta": {
                            "ratio": ratio,
                            "size": f"{act_w}x{act_h}",
                            "aspect_ratio": round(act_w / act_h, 4),
                            "source": "agnes_hub",
                            "is_background": True,
                            "ready_for_posterlab": True
                        },
                    }
                return {"ok": False, "error": "Risposta senza URL da Agnes AI Hub", "code": 502}
        except urllib.error.HTTPError as err:
            err_text = err.read().decode("utf-8", errors="replace")
            print(f"[ROUTER] Agnes HTTP {err.code}: {err_text[:200]}")
            return {"ok": False, "error": f"Agnes AI HTTP {err.code}: {err_text[:150]}", "code": err.code}
        except Exception as exc:
            print(f"[ROUTER] Agnes Error: {exc}")
            return {"ok": False, "error": f"Agnes Connection Error: {exc}", "code": 502}

    # -------------------------------------------------------------
    # AUTO-ROUTER: Cascata Intelligente con Auto-Switch
    # -------------------------------------------------------------
    def generate(self, prompt: str, quality: str = "auto", ratio: str = "1:1", width: int = None, height: int = None, requested_model: str = None, image: str = None) -> dict:
        w, h = get_dimensions(ratio, width, height)
        model = (requested_model or "").strip()

        # Salva eventuale immagine di riferimento
        ref_url = save_reference_image(image) if image else None

        # 1. Modelli specifici richiesti dall'utente
        if model in ("gemini-2.5-flash", "gemini-flash", "gemini-flash-image", "gemini-3-pro-image", "gemini-3.1-flash-image-preview"):
            res = self.call_gemini_flash(prompt, ratio, w, h, image_data=image)
            if ref_url and res.get("ok"):
                res.setdefault("meta", {})["reference_image"] = ref_url
            return res

        elif model.startswith("agnes-") or "agnes" in model:
            res = self.call_agnes(prompt, ratio, w, h, model=model)
            if ref_url and res.get("ok"):
                res.setdefault("meta", {})["reference_image"] = ref_url
            return res

        elif model and model not in ("auto-router", "auto"):
            res = self.call_llmapi_adapter(prompt, quality=quality, ratio=ratio, width=w, height=h, model=model, image_data=image)
            if ref_url and res.get("ok"):
                res.setdefault("meta", {})["reference_image"] = ref_url
            return res

        # 2. CASCATA AUTO-ROUTER (FREE TIER)
        fallbacks_log = []

        # TIER 1: LLMAPI (Qwen Image Max 2025) — Modello Principale Free
        if not self.is_in_cooldown("llmapi"):
            print("[ROUTER] Tier 1: Generazione con Qwen Image Max 2025...")
            res_llm = self.call_llmapi_adapter(prompt, quality=quality, ratio=ratio, width=w, height=h, model="qwen-image-max-2025-12-30", image_data=image)
            if res_llm.get("ok"):
                res_llm["meta"]["router_chain"] = ["Qwen Image Max (success)"]
                if ref_url:
                    res_llm["meta"]["reference_image"] = ref_url
                return res_llm
            err = res_llm.get("error")
            fallbacks_log.append(f"Qwen Image Max non disponibile: {err}")
            print(f"[ROUTER] Tier 1 fallito ({err}). Auto-switch ad Agnes Studio...")
        else:
            fallbacks_log.append("LLMAPI in cooldown temporaneo.")

        # TIER 2: Agnes Background Studio (agnes-image-2.5-flash) — Fallback Free
        if not self.is_in_cooldown("agnes"):
            print("[ROUTER] Tier 2: Fallback su Agnes Background Studio...")
            res_agnes = self.call_agnes(prompt, ratio, w, h, model="agnes-image-2.5-flash")
            if res_agnes.get("ok"):
                res_agnes["meta"]["router_chain"] = fallbacks_log + ["Agnes Background Studio (fallback success)"]
                res_agnes["meta"]["fallback_used"] = True
                if ref_url:
                    res_agnes["meta"]["reference_image"] = ref_url
                return res_agnes
            fallbacks_log.append(f"Agnes Studio fallito: {res_agnes.get('error')}")
        else:
            fallbacks_log.append("Agnes Studio in cooldown temporaneo.")

        return {
            "ok": False,
            "error": "Tutti i provider del router sono temporaneamente non disponibili.",
            "details": fallbacks_log,
            "status": 502,
        }
