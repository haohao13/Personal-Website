import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

const badgeVariants = {
  default: "border-transparent bg-neutral-900 text-white hover:bg-neutral-800",
  secondary: "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
  outline: "text-neutral-950 border border-neutral-200",
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 ${badgeVariants[variant]} ${className || ''}`}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge }
