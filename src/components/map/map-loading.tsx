import type { ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';

export function MapLoading({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-xs">
      <output className="flex items-center gap-2 rounded-md bg-black/80 px-4 py-2 text-sm text-white">
        <Spinner className="size-5" />
        {children}
      </output>
    </div>
  );
}
