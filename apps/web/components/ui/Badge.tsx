import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-surface-raised text-gray-300 border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-secondary/10 text-secondary border-secondary/30",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "running":
      return "success";
    case "paused":
    case "pending":
      return "info";
    case "completed":
      return "default";
    case "stopped":
    case "error":
      return "danger";
    default:
      return "default";
  }
}
