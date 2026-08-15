"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, wsUrl } from "@/lib/api";
import type { SimulationSnapshot } from "@/types/simulation";

export type ConnectionState = "connecting" | "connected" | "disconnected";

export function useSimulation(simId: string) {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let active = true;

    const socket = new WebSocket(wsUrl(`/ws/simulations/${simId}`));
    socketRef.current = socket;

    socket.onopen = () => {
      if (active) setConnection("connected");
    };
    socket.onmessage = (event) => {
      if (!active) return;
      try {
        setSnapshot(JSON.parse(event.data) as SimulationSnapshot);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = () => {
      if (active) setConnection("disconnected");
    };
    socket.onerror = () => {
      if (active) setConnection("disconnected");
    };

    return () => {
      active = false;
      socket.close();
    };
  }, [simId]);

  const controls = {
    start: useCallback(() => api.post(`/simulations/${simId}/start`), [simId]),
    pause: useCallback(() => api.post(`/simulations/${simId}/pause`), [simId]),
    stop: useCallback(() => api.post(`/simulations/${simId}/stop`), [simId]),
  };

  return { snapshot, connection, controls };
}
