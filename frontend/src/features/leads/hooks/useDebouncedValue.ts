import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(
  value: T,
  delayMs = 300,
  onDebounced?: (debouncedValue: T) => void,
): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
      onDebounced?.(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs, onDebounced]);

  return debouncedValue;
}
