import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]"
  }

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-label="Carregando"
      {...props}
    >
      <div
        className={cn(
          "border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Carregando</span>
    </div>
  )
}

export { Spinner }

