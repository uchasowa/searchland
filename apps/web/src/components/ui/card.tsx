import * as React from 'react';

import { cn } from './utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 overflow-visible rounded-xl border',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid gap-1.5 px-6 pt-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('font-semibold leading-none', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('overflow-visible px-6 pb-6 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
