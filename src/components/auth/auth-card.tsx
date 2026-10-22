import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** The one card shell the login and reset views share. Full width on a phone, fixed beside the placeholders from `md` up. */
export function AuthCard({ className, ...props }: Readonly<React.ComponentProps<typeof Card>>) {
  return (
    <Card
      className={cn(
        'w-full gap-0 rounded-3xl border-0 py-0 shadow-none md:w-[411px] md:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

/** Link-looking action inside the card copy: a button, since there is no destination URL. */
export function AuthLinkButton(props: Readonly<React.ComponentProps<'button'>>) {
  return <button type="button" className="text-primary underline" {...props} />;
}
