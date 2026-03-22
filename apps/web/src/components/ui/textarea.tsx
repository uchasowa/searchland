import * as React from 'react';

import { cn } from './utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'placeholder:text-muted-foreground flex min-h-32 w-full resize-none rounded-md border border-input bg-[var(--input-background)] px-3 py-2 text-base transition-colors outline-none md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
