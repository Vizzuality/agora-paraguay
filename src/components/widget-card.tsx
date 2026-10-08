import type { ReactNode } from 'react';

import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/*
 * What the analysis widgets share, from the design's widget frame: the light card, the
 * header (title, info tip, a subtitle line), the 66px figure, and the pieces of a track
 * with a marker. Each card composes these and owns only what it draws.
 */

/** The widget's surface: 254px tall at least, the content pinned top and bottom. */
export function WidgetCard({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        className,
      )}
    >
      {children}
    </Card>
  );
}

type WidgetHeaderProps = {
  label: string;
  /** The metadata's description, behind the title's info icon. */
  description?: string | null;
  /** The line under the title: the unit, or what the chart counts. */
  subtitle?: string | null;
  /** Top-right slot, hidden in the design for now. */
  action?: ReactNode;
};

/**
 * The title with its info tip beside it and the subtitle under both. The heading's
 * parent is this header and its grandparent the card: the e2e specs climb that way.
 */
export function WidgetHeader({
  label,
  description,
  subtitle,
  action,
}: Readonly<WidgetHeaderProps>) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
      <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
      <InfoTip
        description={description}
        subject={label}
        className="mt-0.5 text-accent-foreground"
      />
      {action && <div className="col-start-2 row-start-1 justify-self-end">{action}</div>}
      {subtitle && (
        <p className="col-span-2 text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** The large figure: a class or a number. `slot` is what the specs read it by. */
export function WidgetFigure({
  slot = 'figure',
  children,
}: Readonly<{ slot?: string; children: ReactNode }>) {
  return (
    <p data-slot={slot} className="text-[66px] leading-normal font-extralight tracking-[0.408px]">
      {children}
    </p>
  );
}

type TrackMarkerProps = {
  /** Where the marker sits, 0–100 along the parent track. */
  at: number;
  /** The track's classes before the marker, and after it (the same when left out). */
  track: string;
  after?: string;
  /** The marker's classes. */
  marker: string;
  /** Something to hang on the marker, such as the value over it. */
  children?: ReactNode;
};

/**
 * A track with a marker on it: the stretch before, the marker, the stretch after, as
 * flex weights so the marker lands at `at` whatever the width. Renders into a flex
 * parent (`flex items-center gap-[2px]`), which may be the whole track or one band of it.
 */
export function TrackMarker({
  at,
  track,
  after = track,
  marker,
  children,
}: Readonly<TrackMarkerProps>) {
  return (
    <>
      <span className={cn('h-2 min-w-0 rounded-[2px]', track)} style={{ flexGrow: at }} />
      <span className={cn('relative h-6 w-1 shrink-0 rounded-[2px]', marker)}>{children}</span>
      <span className={cn('h-2 min-w-0 rounded-[2px]', after)} style={{ flexGrow: 100 - at }} />
    </>
  );
}

/** The labels under a track, spread from edge to edge; `slot` marks one of them for the specs. */
export function TrackTicks({
  labels,
  slot,
}: Readonly<{ labels: string[]; slot?: { index: number; name: string } }>) {
  return (
    <ul className="flex w-full justify-between text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
      {labels.map((label, index) => (
        <li key={label} data-slot={slot?.index === index ? slot.name : undefined}>
          {label}
        </li>
      ))}
    </ul>
  );
}
