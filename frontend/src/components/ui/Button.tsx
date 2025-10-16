import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => {
    const baseClasses = variant === "primary" ? "btn-primary" : "btn-secondary";
    return (
        <button
            className={cn(baseClasses, className)}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button };
