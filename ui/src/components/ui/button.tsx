// ui/src/components/ui/button.tsx
// OneAgent Button Component with Constitutional AI validation

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // OneAgent specific variants
        agent: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg",
        enhanced: "bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg",
        oneagent: "oneagent-gradient text-white hover:opacity-90 shadow-lg",
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
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  // OneAgent specific props
  qualityScore?: number;
  agentType?: 'enhanced-development' | 'base' | 'specialized' | 'research-flow' | 'fitness-flow';
}

/**
 * OneAgent Button Component
 * Implements Constitutional AI principles: Helpfulness, Safety, Transparency
 * BMAD elicitation point 4: Goal alignment with user experience
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, qualityScore, agentType, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Constitutional AI validation: Safety check for disabled state
    const isDisabled = props.disabled || (qualityScore !== undefined && qualityScore < 70);
    
    // Enhanced variant selection based on agent type
    const enhancedVariant = React.useMemo(() => {
      if (agentType === 'enhanced-development') return 'enhanced';
      if (agentType && agentType !== 'base') return 'agent';
      return variant;
    }, [agentType, variant]);

    return (
      <Comp
        className={cn(buttonVariants({ variant: enhancedVariant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        title={qualityScore ? `Quality Score: ${qualityScore}%` : undefined}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"

export { Button, buttonVariants }
