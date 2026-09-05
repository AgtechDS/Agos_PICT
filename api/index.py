#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Serverless Function entrypoint per agtechdesigne Studio (AGOS Pict).
Espone gli endpoint API /status, /models, /api/generate tramite BaseHTTPRequestHandler.
"""

import os
import sys
from pathlib import Path

# Assicura che la radice del repository sia accessibile da sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server import Handler


class handler(Handler):
    """
    Handler Serverless compatibile con il runtime Vercel Python.
    Eredita tutte le rotte API, CORS e logica di routing da server.Handler.
    """
    pass
