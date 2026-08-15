"""Traffic / congestion prediction (planned for a later milestone)."""

from __future__ import annotations

from typing import Any


class PredictionService:
    name = "prediction"

    def predict(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Traffic prediction is scheduled for a later milestone")
