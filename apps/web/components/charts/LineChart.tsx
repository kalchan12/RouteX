"use client";

interface LineChartProps {
  points: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  stroke?: string;
  xLabel?: string;
  yLabel?: string;
}

export function LineChart({
  points,
  width = 600,
  height = 180,
  stroke = "#8B5CF6",
  xLabel,
  yLabel,
}: LineChartProps) {
  if (points.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center rounded-md border border-border bg-surface text-xs text-muted"
      >
        Not enough data yet
      </div>
    );
  }

  const padding = 24;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const ySpan = Math.max(1e-9, maxY - minY);
  const xSpan = Math.max(1, maxX - minX);

  const px = (x: number) => padding + ((x - minX) / xSpan) * innerW;
  const py = (y: number) => padding + innerH - ((y - minY) / ySpan) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
    .join(" ");

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={8}
          fill="#11151C"
          stroke="#232A36"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#232A36"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#232A36"
        />
        <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
        <circle
          cx={px(points[points.length - 1].x)}
          cy={py(points[points.length - 1].y)}
          r={3}
          fill={stroke}
        />
      </svg>
      {xLabel && (
        <div className="absolute bottom-0 right-3 text-[10px] text-muted">
          {xLabel}
        </div>
      )}
      {yLabel && (
        <div className="absolute left-0 top-3 text-[10px] text-muted">
          {yLabel}
        </div>
      )}
    </div>
  );
}
