import { Minus, Plus } from 'lucide-react';
import { useMap } from 'react-map-gl/maplibre';

import { cn } from '@/lib/utils';

const buttonClass =
  'flex h-8 w-full items-center justify-center border bg-background ' +
  'border-border text-foreground transition-colors hover:bg-accent cursor-pointer';

/**
 * Zoom control matching the Figma design (node 5187:12646): two stacked
 * capsule buttons that replace MapLibre's default NavigationControl.
 */
export function ZoomControl() {
  const { current: map } = useMap();

  const handleZoom = (direction: 'in' | 'out') => {
    if (!map) return;
    if (direction === 'in' && map.getZoom() < map.getMaxZoom()) {
      map.zoomIn();
    }
    if (direction === 'out' && map.getZoom() > map.getMinZoom()) {
      map.zoomOut();
    }
  };

  return (
    <div className="absolute right-4 bottom-5 flex w-8 flex-col">
      <button
        type="button"
        aria-label="Acercar"
        onClick={() => handleZoom('in')}
        className={cn(buttonClass, '-mb-px rounded-t-full')}
      >
        <Plus className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Alejar"
        onClick={() => handleZoom('out')}
        className={cn(buttonClass, 'rounded-b-full')}
      >
        <Minus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
