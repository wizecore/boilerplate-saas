import { useEffect } from "react";
import { useState } from "react";

/** Debouncing involves starting a timer when an event occurs and resetting the timer whenever a new event occurs within the delay period. */
export const useDebounceState = <T>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
