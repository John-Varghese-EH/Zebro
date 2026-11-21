import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-sky text-navy-950 font-bold hover:bg-sky/90 shadow-sm',
      destructive: 'bg-alert text-white hover:bg-alert/90 shadow-sm',
      outline: 'border border-white/10 bg-white/5 hover:bg-white/10 text-chalk',
      secondary: 'bg-white/10 text-chalk hover:bg-white/20',
      ghost: 'hover:bg-white/10 text-chalk-dim hover:text-chalk',
      link: 'text-sky underline-offset-4 hover:underline',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-xs',
      sm: 'h-7 rounded-full px-3 text-[11px]',
      lg: 'h-11 rounded-lg px-6 text-sm',
      icon: 'h-8 w-8',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
