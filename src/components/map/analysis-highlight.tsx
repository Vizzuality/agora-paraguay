import { useAtomValue } from "jotai";
import { Layer, Source } from "react-map-gl/maplibre";

import { analysisPolygonAtom } from "@/store/analysis";

/**
 * Outlines the polygon picked for analysis. A declarative react-map-gl layer rather
 * than Terra Draw styling: the analysis selection is app state, and this keeps it out
 * of Terra Draw's styling plumbing entirely.
 *
 * The color is a hex literal because MapLibre paints on canvas and cannot resolve CSS
 * variables; amber, so it reads against Terra Draw's blue polygons.
 */
export function AnalysisHighlight() {
  const polygon = useAtomValue(analysisPolygonAtom);

  if (polygon === null) return null;

  return (
    <Source id="analysis-selection" type="geojson" data={polygon}>
      <Layer
        id="analysis-selection-outline"
        type="line"
        paint={{ "line-color": "#f59e0b", "line-width": 3 }}
      />
    </Source>
  );
}
