import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "bg-primary text-white hover:bg-primary/90 disabled:bg-primary/40",
  secondary:
    "bg-secondary/15 text-secondary hover:bg-secondary/25 disabled:opacity-40",
  outline:
    "border border-border bg-transparent text-gray-200 hover:border-primary/50 hover:text-white disabled:opacity-40",
  ghost: "bg-transparent text-muted hover:bg-surface-raised hover:text-white disabled:opacity-40",
  danger:
    "bg-danger/15 text-danger hover:bg-danger/25 disabled:opacity-40",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
