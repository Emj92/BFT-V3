import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-hint font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-600 shadow-md hover:shadow-lg",
        destructive:
          "bg-red-600 text-white hover:bg-red-600 shadow-md hover:shadow-lg",
        outline:
          "border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600/10 hover:scale-105",
        secondary:
          "bg-gray-600 text-white hover:bg-gray-600 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105 text-foreground",
        link: "text-blue-600 underline-offset-4 hover:underline hover:scale-105",
      },
      size: {
        default: "h-touch px-a11y-lg py-a11y-xs",
        sm: "h-touch-sm rounded-md px-a11y-md",
        lg: "h-12 rounded-md px-a11y-xl",
        icon: "h-touch w-touch",
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
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
