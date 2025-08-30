import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Animation variants
const motionVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeInOut" },
  },
};

const contentVariants: Variants = {
  rest: { x: 0 },
  hover: {
    x: 1,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const backgroundVariants: Variants = {
  rest: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

// Custom props interface
interface CustomButtonProps {
  animated?: boolean;
  staggerDelay?: number;
}

// Safe button props without conflicting handlers
type SafeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart" | "onAnimationEnd"
>;

export interface ButtonProps
  extends SafeButtonProps,
    VariantProps<typeof buttonVariants>,
    CustomButtonProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      animated = true,
      staggerDelay = 0,
      children,
      ...props
    },
    ref
  ) => {
    const getBackgroundGradient = () => {
      switch (variant) {
        case "default":
          return "bg-gradient-to-r from-primary to-primary/80";
        case "destructive":
          return "bg-gradient-to-r from-destructive to-destructive/80";
        case "secondary":
          return "bg-gradient-to-r from-secondary to-secondary/80";
        case "outline":
          return "bg-accent/50";
        case "ghost":
          return "bg-accent/30";
        default:
          return "bg-gradient-to-r from-primary to-primary/80";
      }
    };

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const motionProps = animated
      ? {
          variants: motionVariants,
          initial: { opacity: 0, y: 20, scale: 0.9 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.5,
              delay: staggerDelay,
              ease: "easeOut",
            },
          },
          whileHover: "hover" as const,
          whileTap: "tap" as const,
        }
      : {};

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...motionProps}
        {...props}
      >
        {animated && (
          <motion.div
            variants={backgroundVariants}
            className={`absolute inset-0 ${getBackgroundGradient()}`}
          />
        )}
        <motion.div
          variants={animated ? contentVariants : undefined}
          className="relative z-10 flex items-center justify-center gap-2"
        >
          {children}
        </motion.div>
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
