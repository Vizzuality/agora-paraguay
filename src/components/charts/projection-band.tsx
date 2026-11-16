import { scaleLinear, scalePoint } from '@visx/scale';
import { Area, LinePath } from '@visx/shape';

import { HitAreas, Responsive, SVG_CLASS } from '@/components/charts/plot';
import { formatNumber, formatTick } from '@/lib/analysis/number-scale';
import type { ProjectionPoint } from '@/lib/analysis/projection';

const HEIGHT = 320;
/** Room for the unit over the axis, the tick labels left of it and the point labels under it. */
const TOP = 28;
const LEFT = 32;
const BOTTOM = 32;
/** How far in the first and last points sit, so their centred labels stay inside the card. */
const INSET = 64;

const TEXT_CLASS = 'fill-muted-foreground text-[12px]';

type ProjectionBandProps = {
  points: ProjectionPoint[];
  min: number;
  max: number;
  ticks: number[];
  unit: string | null;
};

/** A point's tooltip: its three scenarios, top to bottom as the band draws them. */
function PointReading({ point, unit }: Readonly<{ point: ProjectionPoint; unit: string | null }>) {
  const suffix = unit ? ` ${unit}` : '';
  const rows = [
    ['Optimista', point.high],
    ['Central', point.mid],
    ['Pesimista', point.low],
  ] as const;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-medium">
        {point.label}
        {point.year && ` (${point.year})`}
      </p>
      {rows.map(([name, value]) => (
        <p key={name}>
          {name}: {formatNumber(value)}
          {suffix}
        </p>
      ))}
    </div>
  );
}

/** The pessimist–optimist band and the central line over the points, on a t/ha axis. */
export function ProjectionBand({ points, min, max, ticks, unit }: Readonly<ProjectionBandProps>) {
  return (
    <Responsive height={HEIGHT}>
      {(width) => {
        const x = scalePoint({
          domain: points.map((point) => point.label),
          range: [LEFT + INSET, width - INSET],
        });
        const y = scaleLinear({ domain: [min, max], range: [HEIGHT - BOTTOM, TOP] });
        const at = (point: ProjectionPoint) => x(point.label) ?? 0;

        return (
          <svg viewBox={`0 0 ${width} ${HEIGHT}`} className={SVG_CLASS}>
            {unit && (
              <text x={0} y={TOP - 12} className={TEXT_CLASS}>
                {unit}
              </text>
            )}
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={LEFT}
                  x2={width}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={LEFT - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className={TEXT_CLASS}
                >
                  {formatTick(tick)}
                </text>
              </g>
            ))}
            {points.map((point) => (
              <g key={point.label}>
                <line
                  x1={at(point)}
                  x2={at(point)}
                  y1={TOP - 8}
                  y2={HEIGHT - BOTTOM}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={at(point)}
                  y={HEIGHT}
                  textAnchor="middle"
                  dominantBaseline="text-after-edge"
                  className={`${TEXT_CLASS} uppercase`}
                >
                  {point.label}
                </text>
              </g>
            ))}
            <Area
              data={points}
              x={at}
              y0={(point) => y(point.low)}
              y1={(point) => y(point.high)}
              style={{ fill: 'var(--chart-1)' }}
              opacity={0.5}
            />
            <LinePath
              data={points}
              x={at}
              y={(point) => y(point.mid)}
              style={{ stroke: 'var(--chart-1)' }}
              strokeWidth={2}
            />
            <HitAreas
              height={HEIGHT}
              areas={points.map((point) => ({
                key: point.label,
                x: at(point) - x.step() / 2,
                width: x.step(),
                label: <PointReading point={point} unit={unit} />,
              }))}
            />
          </svg>
        );
      }}
    </Responsive>
  );
}
