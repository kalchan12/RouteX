"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  FlaskConical,
  GitCompareArrows,
  LayoutDashboard,
  Network,
  Settings,
  TrafficCone,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulations", label: "Simulations", icon: Activity },
  { href: "/scenarios", label: "Scenarios", icon: TrafficCone },
  { href: "/networks", label: "Networks", icon: Network },
  { href: "/algorithms", label: "Algorithms", icon: GitCompareArrows },
  { href: "/benchmarks", label: "Benchmarks", icon: FlaskConical },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 border-b border-border px-5 py-4"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/15 text-primary">
          <TrafficCone size={18} />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">
            RouteX
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Traffic Simulator
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-surface-raised hover:text-white"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 text-[11px] leading-relaxed text-muted">
        University capstone — traffic & route optimization simulator.
      </div>
    </aside>
  );
}
