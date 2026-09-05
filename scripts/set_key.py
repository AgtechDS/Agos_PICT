#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Imposta LLMAPI_API_KEY nel file .env in modo sicuro (input oscurato).
Uso: python set_key.py
Non stampa la chiave, non la salva in storico.
"""

import getpass
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent / ".env"

def main():
    if not ENV_FILE.exists():
        print("ERRORE: file .env non trovato")
        return

    lines = ENV_FILE.read_text(encoding="utf-8").splitlines()
    key = getpass.getpass("Inserisci LLMAPI_API_KEY (input oscurato): ").strip()
    if not key:
        print("ERRORE: chiave vuota, operazione annullata")
        return

    found = False
    new_lines = []
    for line in lines:
        if line.startswith("LLMAPI_API_KEY="):
            new_lines.append(f"LLMAPI_API_KEY={key}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"LLMAPI_API_KEY={key}")

    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    print("KEY_AGGIORNATA=OK")
    print("BASE_URL=corretto a https://api.llmapi.ai/v1")

if __name__ == "__main__":
    main()
