import * as React from 'react';

import { cn } from './utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border border-input bg-[var(--input-background)] px-3 py-1 text-base transition-colors outline-none md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
