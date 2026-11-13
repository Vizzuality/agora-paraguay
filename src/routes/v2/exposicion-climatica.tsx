import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { DistrictPanel, DistrictPrompt } from '@/components/district-panel';

/**
 * Exposición climática in the redesign: the map sits in the settings column; the content
 * column is the prompt until a district is picked, then that district's panel.
 */
export const Route = createFileRoute('/v2/exposicion-climatica')({
  component: ExposicionPage,
});

function ExposicionPage() {
  return (
    <>
      <h1 className="sr-only">Exposición climática</h1>
      <ClientOnly fallback={<DistrictPrompt />}>
        <DistrictPanel />
      </ClientOnly>
    </>
  );
}
