"use client";

interface Props {
  velocityPct: number;
  size?: number;
}

export function Speedometer({ velocityPct, size = 260 }: Props) {
  const min = -10;
  const max = 40;
  const clamped = Math.max(min, Math.min(max, velocityPct));
  const pct = (clamped - min) / (max - min);

  const radius = size / 2 - 20;
  const cx = size / 2;
  const cy = size * 0.55;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalAngle = endAngle - startAngle;

  const toXY = (angle: number, r: number) => ({
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  });

  const needleAngle = startAngle + totalAngle * pct;
  const needle = toXY(needleAngle, radius - 14);

  const arc = (fromPct: number, toPct: number, color: string) => {
    const a1 = startAngle + totalAngle * fromPct;
    const a2 = startAngle + totalAngle * toPct;
    const p1 = toXY(a1, radius);
    const p2 = toXY(a2, radius);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return (
      <path
        d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`}
        stroke={color}
        strokeWidth={16}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const bp = (v: number) => (v - min) / (max - min);

  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
      <defs>
        <linearGradient id="speedo-needle" x1="0" x2="1">
          <stop offset="0" stopColor="#F6F4EE" />
          <stop offset="1" stopColor="#C6FF6E" />
        </linearGradient>
      </defs>

      {arc(bp(-10), bp(0), "#7ED9D1")}
      {arc(bp(0), bp(8), "#C6FF6E")}
      {arc(bp(8), bp(18), "#F5C542")}
      {arc(bp(18), bp(28), "#FF8A5B")}
      {arc(bp(28), bp(40), "#FF4D6D")}

      <line
        x1={cx}
        y1={cy}
        x2={needle.x}
        y2={needle.y}
        stroke="url(#speedo-needle)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={8} fill="#0A0B10" stroke="#C6FF6E" strokeWidth={2} />
    </svg>
  );
}
