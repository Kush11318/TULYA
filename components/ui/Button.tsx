import * as React from "react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary'
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white"
        const variants = {
            primary: "bg-black text-white hover:bg-black/90",
            secondary: "bg-transparent text-black hover:bg-gray-100 underline-offset-4 hover:underline",
        }

        return (
            <button
                className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} h-10 py-2 px-4 ${className}`}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? 'Wait...' : children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
