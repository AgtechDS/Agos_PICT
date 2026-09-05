#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test di verifica per ImageRouter AGOS:
1. Test Google Gemini 3.1 Flash Image (PosterLab Engine)
2. Test Qwen Image Max (LLMAPI Free)
3. Test Agnes AI Hub
4. Test Auto-Router completo con auto-switch
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from server import load_env
from image_router import ImageRouter

def run_tests():
    print("=" * 60)
    print("   TEST AUTOMATIZZATO IMAGE ROUTER MULTI-PROVIDER AGOS")
    print("=" * 60)

    router = ImageRouter(env_loader_fn=load_env)
    prompt = "A modern minimal graphic poster of an orange slice, high contrast, clean vector art"

    # TEST 1: Google Gemini 3.1 Flash Image (PosterLab Engine)
    print("\n[TEST 1] Google Gemini 3.1 Flash Image Preview (PosterLab)...")
    res_gemini = router.call_gemini_flash(prompt, ratio="1:1", width=1024, height=1024)
    print(f"  Result OK: {res_gemini.get('ok')}")
    print(f"  Provider : {res_gemini.get('provider')}")
    print(f"  Model    : {res_gemini.get('model')}")
    print(f"  Image URL: {res_gemini.get('image_url')}")
    if not res_gemini.get("ok"):
        print(f"  Error    : {res_gemini.get('error')}")

    # TEST 2: Qwen Image Max (LLMAPI Free)
    print("\n[TEST 2] Qwen Image Max 2025 (1:1)...")
    res_qwen = router.call_llmapi_adapter(prompt, quality="auto", ratio="1:1", width=1024, height=1024, model="qwen-image-max-2025-12-30")
    print(f"  Result OK: {res_qwen.get('ok')}")
    print(f"  Provider : {res_qwen.get('provider')}")
    print(f"  Image URL: {res_qwen.get('image_url')}")
    if not res_qwen.get("ok"):
        print(f"  Note/Err : {res_qwen.get('error')}")

    # TEST 3: Auto-Router a cascata (16:9)
    print("\n[TEST 3] Auto-Router a Cascata (16:9)...")
    res_auto = router.generate(prompt, ratio="16:9")
    print(f"  Result OK: {res_auto.get('ok')}")
    print(f"  Provider : {res_auto.get('provider')}")
    print(f"  Model    : {res_auto.get('model')}")
    print(f"  Image URL: {res_auto.get('image_url')}")
    print(f"  Chain    : {res_auto.get('meta', {}).get('router_chain')}")

if __name__ == "__main__":
    run_tests()
