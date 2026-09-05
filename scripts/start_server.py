#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Avvia server.py in background su Windows (processo separato, log su file)
e apre automaticamente la pagina del progetto nel browser.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
LOG = BASE_DIR / "server.log"

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200


def free_port(port=8300):
    """Termina eventuali processi orfani sulla porta specificata."""
    try:
        out = subprocess.check_output(f"netstat -aon | findstr :{port}", shell=True).decode()
        for line in out.strip().splitlines():
            if "LISTENING" in line:
                parts = line.strip().split()
                pid = parts[-1]
                subprocess.run(f"taskkill /f /pid {pid}", shell=True, capture_output=True)
    except Exception:
        pass


def main():
    free_port(8300)
    time.sleep(0.5)

    logf = open(LOG, "a", encoding="utf-8")
    proc = subprocess.Popen(
        [sys.executable, "-u", "server.py"],
        cwd=str(BASE_DIR),
        stdout=logf,
        stderr=subprocess.STDOUT,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
    )

    # Avvia helper per apertura automatica del browser
    subprocess.Popen(
        [sys.executable, "open_browser.py", "http://127.0.0.1:8300"],
        cwd=str(BASE_DIR),
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
    )

    print(f"SERVER_STARTED_PID={proc.pid}")
    print(f"LOG_FILE={LOG}")
    print("URL=http://127.0.0.1:8300")


if __name__ == "__main__":
    main()
