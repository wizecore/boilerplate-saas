import * as React from "react"
import { Sparkles } from "lucide-react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<typeof Input>

export interface AiInputProps extends InputProps {
  suggestion?: string
  thinking?: boolean
  onSuggestionAccept?: (suggestion: string) => void
}

/**
 * Input control with AI suggestions.
 * 
 * 1. if suggestion propery passed, and no value entered, it should show a suggested 
 * value and sparkle lucide icon. Upon pressing tab it should fill that value. 
 * On escape it should stop showing the suggested value until you type in something.
 * 
 * 2. if suggestion property passed and value entered, it should show with throttle
 * if typing that value striked and new suggested value on the right with sparkle icon.
 * Upon pressing tab, it should fill that new value, or on escape, it should stop showing
 * the value until you type in something.
 * 
 * 3. suggested value comes from outside the component and if changed outside 
 * should offer new value 
 * 
 * 4. if thinking is true, it should show a sparkle lucide icon and a text "DevOps AI" pulsating
 * and not suggest anything
 */
const AiInput = React.forwardRef<HTMLInputElement, AiInputProps>(
  ({ className, suggestion, onSuggestionAccept, value, onChange, 
     thinking, placeholder, ...props }, ref) => {
    const [showSuggestion, setShowSuggestion] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value || "")
    const [throttledSuggestion, setThrottledSuggestion] = React.useState(suggestion)

    // Throttle suggestion updates
    React.useEffect(() => {
      if (suggestion) {
        const timer = setTimeout(() => {
          setShowSuggestion(true)
          setThrottledSuggestion(suggestion)
        }, 500)
        return () => clearTimeout(timer)
      } else {
        return
      }
    }, [suggestion])

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      setShowSuggestion(true)
      onChange && onChange(e)
    }

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" && !e.shiftKey && showSuggestion && throttledSuggestion && !thinking) {
        e.preventDefault()
        setInputValue(throttledSuggestion)
        onSuggestionAccept && onSuggestionAccept(throttledSuggestion);
        const target = e.target as HTMLInputElement
        target.value = throttledSuggestion;
        target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        onChange && onChange({ target } as React.ChangeEvent<HTMLInputElement>);
        setShowSuggestion(false);
      } else if (e.key === "Escape") {
        setShowSuggestion(false);
      }
    }

    // Update internal value when external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setInputValue(value);
      }
    }, [value])

    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder={placeholder ? placeholder + (suggestion && showSuggestion ? " (⇥ to accept)" : "") : 
            (suggestion && showSuggestion ? "Press ⇥ to accept suggestion" : undefined)}
          {...props}
        />

        {thinking ? (<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-foreground/80 hover:text-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm animate-pulse">DevOps AI</span>
          </div>
        ) : (showSuggestion && throttledSuggestion && suggestion !== inputValue) ? (
          <div className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-foreground/80 hover:text-foreground"
            onClick={() => {
              setInputValue(throttledSuggestion)
              onSuggestionAccept && onSuggestionAccept(throttledSuggestion)
              setShowSuggestion(false)
            }}
          >
            <span className="text-sm">{throttledSuggestion}</span>
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">DevOps AI</span>
          </div>
        ) : null}
      </div>
    )
  }
)

AiInput.displayName = "AiInput"

export { AiInput } 