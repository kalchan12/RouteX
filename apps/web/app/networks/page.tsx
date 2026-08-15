import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NetworksPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Networks</h1>
        <p className="text-sm text-muted">
          The road network model — a weighted, directed graph.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Graph model</CardTitle>
          <CardDescription>
            G = (V, E) — nodes are intersections, edges are road segments.
          </CardDescription>
        </CardHeader>
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 text-xs text-gray-300">
{`Node:
  id, x, y, type, traffic_light_id
  type: intersection | origin | destination | hospital

Road:
  id, source, destination
  distance, speed_limit, capacity, lanes
  status: open | closed | accident | construction
  dynamic: current_vehicle_count, congestion, current_travel_time`}
        </pre>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Congestion & travel time</CardTitle>
          <CardDescription>
            Transparent teaching model (not a calibrated real-world model).
          </CardDescription>
        </CardHeader>
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 text-xs text-gray-300">
{`congestion = vehicle_count / capacity
current_travel_time = base_travel_time × (1 + congestion)
effective_speed     = speed_limit / (1 + congestion)

Routing cost (default) = current_travel_time
Closed/accident roads  = infinite cost (never routed through)`}
        </pre>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation determinism</CardTitle>
          <CardDescription>
            Same scenario + seed + configuration ⇒ same behaviour, every time.
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-muted">
          All randomness flows through a single seeded PRNG used for network
          generation and vehicle spawn schedules. This guarantees reproducible
          experiments for the capstone.
        </p>
      </Card>
    </div>
  );
}
