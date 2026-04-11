import * as React from "react"

const buttonVariants = {
  default: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
  secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
  outline: "border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${className || ''}`}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
