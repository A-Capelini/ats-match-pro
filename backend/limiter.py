"""Configuração central do Rate Limiting (slowapi).

Centralizar o `Limiter` num módulo próprio evita import circular entre
`main.py` (que registra o middleware/handler) e `routers/analysis.py`
(que aplica o decorator `@limiter.limit`).
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Limite padrão por IP. Pode ser sobrescrito por variável de ambiente
# (ex.: "10/minute") caso queira afrouxar/apertar em produção.
DEFAULT_ANALYZE_LIMIT = os.getenv("ANALYZE_RATE_LIMIT", "5/minute")

limiter = Limiter(key_func=get_remote_address, default_limits=[])
