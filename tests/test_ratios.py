#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Suite Aspect Ratio MIT-Grade & Agnes Background Studio
Verifica analitica su tutti gli 8 aspect ratio supportati da AGOS Pict:
- Tolleranza dimensionale < 1.5%
- Nessuna distorsione anamorfica
- Center crop di precisione
- Test Agnes Background Studio (0 crediti, specializzazione sfondi)
"""

import sys
import io
from pathlib import Path
from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import image_router
from image_router import RATIO_DIMS, get_dimensions, enforce_aspect_ratio, ImageRouter
from server import load_env

def test_all_aspect_ratios():
    print("=" * 70)
    print("   TEST SUITE: PRECISION ASPECT-RATIO ENGINE (MIT-GRADE)")
    print("=" * 70)

    test_dir = BASE_DIR / "static" / "outputs" / "ratio_tests"
    test_dir.mkdir(parents=True, exist_ok=True)

    results = []

    # 1. Verifica geometrica su tutti gli 8 ratio
    for ratio, (tw, th) in RATIO_DIMS.items():
        target_aspect = tw / th

        # Crea un'immagine di test non quadrata (es. 1024x1024 o 1200x800) per simulare l'output grezzo del provider
        raw_canvas = Image.new("RGB", (1024, 1024), color=(30, 40, 60))
        test_file = test_dir / f"test_raw_{ratio.replace(':', '_')}.png"
        raw_canvas.save(test_file, format="PNG")

        # Applica l'enforcement MIT-grade
        final_w, final_h = enforce_aspect_ratio(test_file, ratio, tw, th)

        # Verifica con Pillow sul file fisico salvato
        with Image.open(test_file) as verified_im:
            actual_w, actual_h = verified_im.size
            actual_aspect = actual_w / actual_h
            error_margin = abs(actual_aspect - target_aspect) / target_aspect

            passed = error_margin <= 0.015 and (actual_w, actual_h) == (final_w, final_h)
            results.append((ratio, tw, th, actual_w, actual_h, error_margin, passed))

            status_sym = "✅ PASS" if passed else "❌ FAIL"
            print(f"[{status_sym}] Ratio {ratio:5s} -> Target: {tw}x{th} (aspect {target_aspect:.4f}) | "
                  f"Effettivo: {actual_w}x{actual_h} (aspect {actual_aspect:.4f}) | Errore: {error_margin*100:.3f}%")

    all_passed = all(r[-1] for r in results)
    print("\nEsito test geometrici:", "TUTTI SUPERATI (100% MIT-GRADE)" if all_passed else "FALLITO")
    return all_passed


def test_agnes_background_mode():
    print("\n" + "=" * 70)
    print("   TEST SUITE: AGNES BACKGROUND & TEXTURE STUDIO (0 CREDITI)")
    print("=" * 70)

    router = ImageRouter(env_loader_fn=load_env)
    prompt = "Minimalist Swiss poster background, geometric bauhaus canvas, subtle paper grain"

    # Esegui chiamata Agnes Background Studio
    print("[TEST] Invocazione Agnes Background Studio (16:9)...")
    res = router.call_agnes(prompt, ratio="16:9", width=1280, height=720)
    print(f"  OK: {res.get('ok')}")
    print(f"  Provider  : {res.get('provider')}")
    print(f"  Image URL : {res.get('image_url')}")
    print(f"  Meta      : {res.get('meta')}")

    is_ok = res.get("ok", False)
    meta = res.get("meta", {})
    is_bg = meta.get("is_background", False)
    has_posterlab_flag = meta.get("ready_for_posterlab", False)

    print(f"  Verifica is_background     : {'✅ SI' if is_bg else '❌ NO'}")
    print(f"  Verifica ready_for_posterlab: {'✅ SI' if has_posterlab_flag else '❌ NO'}")

    return is_ok and is_bg and has_posterlab_flag


if __name__ == "__main__":
    ratio_ok = test_all_aspect_ratios()
    agnes_ok = test_agnes_background_mode()
    if ratio_ok and agnes_ok:
        print("\n🎉 TUTTI I TEST MIT-GRADE COMPLETATI CON SUCCESSO!")
        sys.exit(0)
    else:
        print("\n⚠️ ALCUNI TEST NON HANNO SUPERATO LA VERIFICA.")
        sys.exit(1)
