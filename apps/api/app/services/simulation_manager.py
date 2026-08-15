"""In-memory simulation runtime manager + WebSocket broadcasting.

Active simulations live only in memory (never in PostgreSQL). A background
asyncio task steps the engine and broadcasts snapshots to connected
WebSocket clients. Benchmarks run headlessly and are CPU-bound on purpose.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

from engine import SimulationConfig, SimulationEngine, SimulationStatus
from engine.config import ScenarioConfig
from engine.routing.registry import get_algorithm, list_algorithms
from fastapi import WebSocket

logger = logging.getLogger(__name__)

LOOP_INTERVAL = 0.1


@dataclass
class SimulationRuntime:
    engine: SimulationEngine
    speed: int = 10
    task: asyncio.Task | None = None
    connections: set[WebSocket] = field(default_factory=set)


class SimulationManager:
    def __init__(self) -> None:
        self._runtimes: dict[str, SimulationRuntime] = {}

    # ------------------------------------------------------------------ #
    # Lifecycle
    # ------------------------------------------------------------------ #
    def create(
        self,
        sim_id: str,
        scenario: ScenarioConfig,
        algorithm: str,
        seed: int,
        max_ticks: int,
        speed: int,
    ) -> SimulationRuntime:
        config = SimulationConfig(
            scenario_id=scenario.id,
            algorithm=algorithm,
            seed=seed,
            max_ticks=max_ticks,
            speed=speed,
        )
        engine = SimulationEngine(scenario, config)
        runtime = SimulationRuntime(engine=engine, speed=speed)
        self._runtimes[sim_id] = runtime
        return runtime

    def get(self, sim_id: str) -> SimulationRuntime | None:
        return self._runtimes.get(sim_id)

    def remove(self, sim_id: str) -> None:
        self._runtimes.pop(sim_id, None)

    def start(self, sim_id: str) -> SimulationRuntime | None:
        runtime = self._runtimes.get(sim_id)
        if runtime is None:
            return None
        if runtime.task is None or runtime.task.done():
            runtime.task = asyncio.create_task(self._run(runtime))
        else:
            runtime.engine.start()
        return runtime

    def pause(self, sim_id: str) -> SimulationRuntime | None:
        runtime = self._runtimes.get(sim_id)
        if runtime is not None:
            runtime.engine.pause()
        return runtime

    def stop(self, sim_id: str) -> SimulationRuntime | None:
        runtime = self._runtimes.get(sim_id)
        if runtime is not None:
            runtime.engine.stop()
        return runtime

    def snapshot(self, sim_id: str) -> dict | None:
        runtime = self._runtimes.get(sim_id)
        return runtime.engine.snapshot() if runtime is not None else None

    # ------------------------------------------------------------------ #
    # WebSockets
    # ------------------------------------------------------------------ #
    async def connect(self, sim_id: str, websocket: WebSocket) -> bool:
        runtime = self._runtimes.get(sim_id)
        if runtime is None:
            return False
        await websocket.accept()
        runtime.connections.add(websocket)
        await websocket.send_json(runtime.engine.snapshot())
        return True

    def disconnect(self, sim_id: str, websocket: WebSocket) -> None:
        runtime = self._runtimes.get(sim_id)
        if runtime is not None:
            runtime.connections.discard(websocket)

    # ------------------------------------------------------------------ #
    # Internals
    # ------------------------------------------------------------------ #
    async def _run(self, runtime: SimulationRuntime) -> None:
        runtime.engine.start()
        while True:
            if runtime.engine.status is not SimulationStatus.RUNNING:
                break
            ticks = max(1, round(runtime.speed * LOOP_INTERVAL))
            for _ in range(ticks):
                if runtime.engine.status is not SimulationStatus.RUNNING:
                    break
                runtime.engine.step()
            await self._broadcast(runtime)
            await asyncio.sleep(LOOP_INTERVAL)
        await self._broadcast(runtime)

    async def _broadcast(self, runtime: SimulationRuntime) -> None:
        if not runtime.connections:
            return
        data = runtime.engine.snapshot()
        for websocket in list(runtime.connections):
            try:
                await websocket.send_json(data)
            except Exception:  # noqa: BLE001 — drop dead connections
                runtime.connections.discard(websocket)

    # ------------------------------------------------------------------ #
    # Benchmarks (headless, CPU-bound)
    # ------------------------------------------------------------------ #
    def run_benchmark(
        self,
        scenario: ScenarioConfig,
        algorithms: list[str] | None,
        runs: int = 1,
    ) -> list[dict]:
        algorithm_names = algorithms or [a["id"] for a in list_algorithms()]
        for name in algorithm_names:
            get_algorithm(name)  # validates

        results: list[dict] = []
        for name in algorithm_names:
            for run in range(runs):
                config = SimulationConfig(
                    scenario_id=scenario.id,
                    algorithm=name,
                    seed=scenario.seed + run,
                    max_ticks=scenario.duration,
                )
                engine = SimulationEngine(scenario, config)
                engine.run(engine.config.max_ticks)
                results.append(
                    {
                        "algorithm": name,
                        "run": run,
                        "seed": config.seed,
                        "tick": engine.clock.tick,
                        "metrics": engine.metrics.summary(engine.manager),
                    }
                )
        return results


manager = SimulationManager()
