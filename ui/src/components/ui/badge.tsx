// ui/src/components/ui/badge.tsx
// OneAgent Badge Component

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // OneAgent variants
        enhanced: "border-transparent bg-gradient-to-r from-green-500 to-blue-600 text-white",
        quality: "border-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  qualityScore?: number;
}

function Badge({ className, variant, qualityScore, ...props }: BadgeProps) {
  // Enhanced quality-based variant selection
  const enhancedVariant = React.useMemo(() => {
    if (qualityScore !== undefined) {
      if (qualityScore >= 90) return 'enhanced';
      if (qualityScore >= 80) return 'quality';
      if (qualityScore < 70) return 'destructive';
    }
    return variant;
  }, [qualityScore, variant]);

  return (
    <div 
      className={cn(badgeVariants({ variant: enhancedVariant }), className)} 
      title={qualityScore ? `Quality Score: ${qualityScore}%` : undefined}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
