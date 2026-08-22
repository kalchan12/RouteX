import { SimulationEvent, EventType } from '../shared/types';

export class EventQueue {
  private events: SimulationEvent[] = [];
  private applied = new Set<string>();

  schedule(event: SimulationEvent): void {
    this.events.push(event);
    this.events.sort((a, b) => a.tick - b.tick);
  }

  pending(currentTick: number): SimulationEvent[] {
    return this.events.filter(e => e.tick === currentTick && !this.applied.has(e.id));
  }

  markApplied(event: SimulationEvent): void {
    this.applied.add(event.id);
  }

  clear(): void {
    this.events = [];
    this.applied.clear();
  }
}

export function createEvent(
  type: EventType,
  tick: number,
  duration: number = 0,
  roadId: string | null = null,
  nodeId: string | null = null,
  payload: Record<string, unknown> = {}
): SimulationEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    tick,
    duration,
    roadId,
    nodeId,
    payload,
  };
}