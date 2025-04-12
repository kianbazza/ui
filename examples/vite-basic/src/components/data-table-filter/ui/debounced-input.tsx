import { Input } from '@/components/ui/input'
import { useCallback, useEffect, useState } from 'react'

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 500, // This is the wait time, not the function
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounceMs?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue)

  // Sync with initialValue when it changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Define the debounced function with useCallback
  const debouncedOnChange = useCallback(
    debounce((newValue: string | number) => {
      onChange(newValue)
    }, debounceMs), // Pass the wait time here
    [debounceMs, onChange], // Dependencies
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue) // Update local state immediately
    debouncedOnChange(newValue) // Call debounced version
  }

  return <Input {...props} value={value} onChange={handleChange} />
}
