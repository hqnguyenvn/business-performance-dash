
import * as React from "react"
import { cn } from "@/lib/utils"

interface NumberInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  allowEmpty?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value = 0, onChange, allowEmpty = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      value === 0 && allowEmpty ? '' : value.toString()
    )

    React.useEffect(() => {
      setDisplayValue(value === 0 && allowEmpty ? '' : value.toString())
    }, [value, allowEmpty])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)
      
      if (inputValue === '') {
        onChange?.(0)
      } else {
        const numValue = parseFloat(inputValue)
        if (!isNaN(numValue)) {
          onChange?.(numValue)
        }
      }
    }

    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-right",
          className
        )}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
