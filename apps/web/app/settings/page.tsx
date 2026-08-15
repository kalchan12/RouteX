import { API_URL } from "@/lib/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-muted">
          Runtime configuration. Credentials are never stored in code.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>
            All configuration comes from environment variables (see .env.example).
          </CardDescription>
        </CardHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">API URL</dt>
            <dd className="font-mono text-gray-200">{API_URL}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Database</dt>
            <dd className="font-mono text-gray-200">via DATABASE_URL</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">AI</dt>
            <dd className="font-mono text-gray-200">disabled by default (optional)</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About RouteX</CardTitle>
          <CardDescription>University capstone project.</CardDescription>
        </CardHeader>
        <p className="text-sm leading-relaxed text-muted">
          RouteX is a controlled simulation environment for traffic-management and
          route-optimization research — not a real-world navigation app. It combines
          a graph-based simulation engine with routing algorithms, congestion
          modelling, analytics and (later) optimization and AI. All experiments are
          deterministic and reproducible.
        </p>
      </Card>
    </div>
  );
}
