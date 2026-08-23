import { z } from 'zod';
import { RoadStatus, RoadType, VehicleType, IncidentType, IncidentSeverity, NodeType, EventType } from '../types';

export const NodeSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  type: z.nativeEnum(NodeType),
  trafficLightId: z.string().nullable().optional(),
});

export const ScenarioRoadSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  distance: z.number().positive(),
  speedLimit: z.number().positive(),
  capacity: z.number().positive(),
  lanes: z.number().int().positive(),
  roadType: z.nativeEnum(RoadType),
  status: z.nativeEnum(RoadStatus),
  priority: z.number(),
});

export const ScenarioNetworkSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(ScenarioRoadSchema),
});

export const ScenarioTrafficLightSchema = z.object({
  nodeId: z.string().min(1),
  greenDuration: z.number().positive(),
  redDuration: z.number().positive(),
  offset: z.number().nonnegative(),
});

export const ScenarioEventSchema = z.object({
  type: z.nativeEnum(EventType),
  tick: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  roadId: z.string().nullable(),
  nodeId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const ScenarioIncidentSchema = z.object({
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  roadId: z.string().nullable(),
  nodeId: z.string().nullable(),
  position: z.object({ x: z.number(), y: z.number() }).nullable(),
  description: z.string(),
  affectedLanes: z.array(z.number()),
  estimatedClearanceTick: z.number().nullable(),
});

export const ScenarioPedestrianSchema = z.object({
  position: z.object({ x: z.number(), y: z.number() }),
  targetPosition: z.object({ x: z.number(), y: z.number() }),
  speed: z.number().positive(),
  state: z.enum(['walking', 'waiting', 'crossing']),
});

export const ScenarioConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  duration: z.number().positive(),
  network: ScenarioNetworkSchema,
  trafficLights: z.array(ScenarioTrafficLightSchema),
  events: z.array(ScenarioEventSchema),
  incidents: z.array(ScenarioIncidentSchema),
  pedestrians: z.array(ScenarioPedestrianSchema),
  vehicleSpawnRate: z.number().positive(),
  vehicleTypes: z.array(z.nativeEnum(VehicleType)),
});
