#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Helper di apertura automatica del browser per AGOS Pict Studio.
Attende che il server HTTP locale sia pronto e apre la pagina.
"""

import sys
import time
import urllib.request
import webbrowser


def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8300"
    status_url = f"{target_url.rstrip('/')}/status"

    # Attendi fino a 15 secondi che il server risponda
    for _ in range(30):
        try:
            with urllib.request.urlopen(status_url, timeout=1) as resp:
                if resp.status == 200:
                    time.sleep(0.3)
                    webbrowser.open(target_url)
                    return
        except Exception:
            time.sleep(0.5)

    # Fallback apertura forzata
    webbrowser.open(target_url)


if __name__ == "__main__":
    main()
