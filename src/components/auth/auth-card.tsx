import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** The one card shell the login and reset views share. */
export function AuthCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn('w-[411px] shrink-0 gap-0 rounded-3xl border-0 py-0 shadow-none', className)}
      {...props}
    />
  );
}

/** Link-looking action inside the card copy: a button, since there is no destination URL. */
export function AuthLinkButton(props: React.ComponentProps<'button'>) {
  return <button type="button" className="text-primary underline" {...props} />;
}
