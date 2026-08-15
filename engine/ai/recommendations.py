"""Recommendation service (planned for a later milestone)."""

from __future__ import annotations

from typing import Any


class RecommendationService:
    name = "recommendation"

    def recommend(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Recommendations are scheduled for a later milestone")
