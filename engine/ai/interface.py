"""AI provider contract.

AI is optional and NEVER a hard dependency. The project works fully without
it. Future providers (local ML, external APIs) implement this interface;
``MockAIProvider`` ships with the scaffold so the plumbing can be exercised
without any API key.
"""

from __future__ import annotations

from typing import Any, Protocol


class AIProvider(Protocol):
    name: str

    def predict_congestion(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        """Return a short-horizon congestion prediction for the snapshot."""
        ...

    def recommend(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        """Return action recommendations (e.g. signal timing suggestions)."""
        ...


class MockAIProvider:
    """Deterministic no-op provider — needs no key and does nothing clever."""

    name = "mock"

    def predict_congestion(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        roads = snapshot.get("roads", [])
        return {
            "horizon_ticks": 10,
            "predicted_max_congestion": max(
                (r.get("congestion", 0.0) for r in roads), default=0.0
            ),
            "provider": self.name,
            "mock": True,
        }

    def recommend(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        return {"provider": self.name, "mock": True, "actions": []}
