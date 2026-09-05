#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test end-to-end: invia un prompt reale a /api/generate e verifica immagine."""

import json
import urllib.request

URL = "http://127.0.0.1:8300/api/generate"
PROMPT = "A tiny red apple, studio lighting, white background, photorealistic"
SIZE = "1024x1024"

payload = json.dumps({"prompt": PROMPT, "size": SIZE}).encode("utf-8")
req = urllib.request.Request(URL, data=payload, method="POST")
req.add_header("Content-Type", "application/json")

print("SENDING_PROMPT=" + PROMPT)
print("WAITING_FOR_LLMAPI...")

try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    print("HTTP_STATUS=" + str(resp.status))
    if "image_url" in data:
        print("GENERATION=SUCCESS")
        print("IMAGE_URL_LEN=" + str(len(data["image_url"])))
        print("IMAGE_URL_PREFIX=" + data["image_url"][:80])
        # salva URL in file per eventuale download
        with open("last_image_url.txt", "w", encoding="utf-8") as f:
            f.write(data["image_url"])
        print("URL_SAVED=last_image_url.txt")
    elif "b64_json" in data:
        print("GENERATION=SUCCESS_B64")
        print("B64_LEN=" + str(len(data["b64_json"])))
        with open("last_image_b64.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(data))
        print("B64_SAVED=last_image_b64.json")
    else:
        print("GENERATION=UNKNOWN_FORMAT")
        print("RESPONSE=" + json.dumps(data)[:500])
except Exception as exc:
    print("GENERATION=ERROR")
    print("DETAIL=" + str(exc))
