"""Structured logging setup.

Log lines carry timestamp, level, module and message. Secrets must never be
logged.
"""

from __future__ import annotations

import logging
import sys

_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        stream=sys.stdout,
        format=_FORMAT,
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
