import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline:
          "text-foreground border-border",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20",
        success:
          "border-transparent bg-success/15 text-success border-success/20",
        warning:
          "border-transparent bg-warning/15 text-warning-foreground border-warning/20",
        info:
          "border-transparent bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400",
        purple:
          "border-transparent bg-purple-500/15 text-purple-600 border-purple-500/20 dark:text-purple-400",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
