import React, { InputHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

// --- Input ---
export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 ${className || ''}`}
      {...props}
    />
  );
});
Input.displayName = "Input";

// --- Button ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'md', loading, children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 py-2",
    lg: "h-10 px-8",
    icon: "h-9 w-9",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";

// --- Select ---
export const Select = ({ value, onChange, options, className }: { value: string, onChange: (val: string) => void, options: { label: string, value: string }[], className?: string }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300 ${className || ''}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950">
        {opt.label}
      </option>
    ))}
  </select>
);

// --- Badge ---
export const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'error' | 'warning' }) => {
  const styles = {
    default: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${styles[variant]}`}>
      {children}
    </span>
  );
};
