import { Minus, Plus } from 'lucide-react';
import { useMap } from 'react-map-gl/maplibre';

import { cn } from '@/lib/utils';

const VARIANTS = {
  // Two stacked capsule buttons, on the main map.
  capsule: {
    group: 'right-4 bottom-5 w-8',
    button: 'h-8 w-full border border-border bg-background text-foreground hover:bg-accent',
    in: '-mb-px rounded-t-full',
    out: 'rounded-b-full',
  },
  // Light tiles with primary icons in one rounded block, inset from the corner: the
  // exposure map and the analysis mini map. A phone pinches instead.
  panel: {
    group: 'right-2 bottom-2 overflow-hidden rounded-2xl max-md:hidden',
    button: 'size-11 bg-background text-primary backdrop-blur-xs hover:bg-accent',
    in: '',
    out: '',
  },
};

/** Zoom control as designed, in place of MapLibre's default NavigationControl. */
export function ZoomControl({
  variant = 'capsule',
}: Readonly<{ variant?: keyof typeof VARIANTS }>) {
  const { current: map } = useMap();
  const styles = VARIANTS[variant];

  const handleZoom = (direction: 'in' | 'out') => {
    if (!map) return;
    if (direction === 'in' && map.getZoom() < map.getMaxZoom()) {
      map.zoomIn();
    }
    if (direction === 'out' && map.getZoom() > map.getMinZoom()) {
      map.zoomOut();
    }
  };

  const buttonClass = cn(
    'flex cursor-pointer items-center justify-center transition-colors',
    styles.button,
  );

  return (
    <div className={cn('absolute flex flex-col', styles.group)}>
      <button
        type="button"
        aria-label="Acercar"
        onClick={() => handleZoom('in')}
        className={cn(buttonClass, styles.in)}
      >
        <Plus className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Alejar"
        onClick={() => handleZoom('out')}
        className={cn(buttonClass, styles.out)}
      >
        <Minus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
