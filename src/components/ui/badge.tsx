import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'alert' | 'ok' | 'saffron';
}

function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-sky/20 text-sky',
    secondary: 'border-transparent bg-white/10 text-chalk',
    outline: 'border-white/15 bg-white/5 text-chalk-dim hover:text-chalk',
    alert: 'border-alert/30 bg-alert/15 text-alert',
    ok: 'border-ok/30 bg-ok/15 text-ok',
    saffron: 'border-saffron/30 bg-saffron/15 text-saffron',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
