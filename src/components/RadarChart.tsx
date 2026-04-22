"use client";

import { DomainScore } from "@/lib/scoring";

interface Props {
  domains: DomainScore[];
  size?: number;
}

export function RadarChart({ domains, size = 320 }: Props) {
  const n = domains.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;

  const pointFor = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (value / 100) * radius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const labelFor = (i: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = radius + 20;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      anchor:
        Math.cos(angle) > 0.3 ? "start" : Math.cos(angle) < -0.3 ? "end" : "middle",
    };
  };

  const poly = domains
    .map((d, i) => {
      const p = pointFor(i, d.score0to100);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25, 50, 75, 100].map((v) => (
        <polygon
          key={v}
          points={domains
            .map((_, i) => {
              const p = pointFor(i, v);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {domains.map((_, i) => {
        const p = pointFor(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={poly}
        fill="rgba(198,255,110,0.18)"
        stroke="#C6FF6E"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {domains.map((d, i) => {
        const p = pointFor(i, d.score0to100);
        return (
          <circle
            key={d.key}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#C6FF6E"
            stroke="#0A0B10"
            strokeWidth={2}
          />
        );
      })}

      {domains.map((d, i) => {
        const l = labelFor(i);
        return (
          <g key={`lbl-${d.key}`}>
            <text
              x={l.x}
              y={l.y}
              textAnchor={l.anchor as "start" | "end" | "middle"}
              fontSize={11}
              fontFamily="Inter, sans-serif"
              fill="rgba(255,255,255,0.7)"
              dominantBaseline="middle"
            >
              {shortLabel(d.label)}
            </text>
            <text
              x={l.x}
              y={l.y + 14}
              textAnchor={l.anchor as "start" | "end" | "middle"}
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              fill="#C6FF6E"
              dominantBaseline="middle"
            >
              {d.score0to100}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function shortLabel(s: string): string {
  return s.split(" ")[0];
}
