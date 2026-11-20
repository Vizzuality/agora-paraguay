import { CircleHelp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import about from '@/content/about.json';

/** The top bar's Acerca de: what AGORA is and what each module covers, in a dialog. */
export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="h-12 gap-2 rounded-3xl pr-4 pl-3 font-normal text-primary [&_svg:not([class*='size-'])]:size-6"
        >
          <CircleHelp aria-hidden />
          {about.button}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-3xl border-0 bg-card p-6 sm:max-w-110 sm:p-10"
      >
        <DialogTitle className="text-4xl leading-normal font-light tracking-[-0.54px] text-foreground">
          {about.title}
        </DialogTitle>
        <DialogDescription>{about.intro}</DialogDescription>
        {about.sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h3 className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">
              {section.title}
            </h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            className="absolute top-0 right-0 size-12 rounded-3xl"
          >
            <X />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
