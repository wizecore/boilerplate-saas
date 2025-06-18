import { useCallback } from "react";

import logger from "@/lib/logger";
import { useState } from "react";

/**
 * From https://usehooks.com/useLocalStorage/
 */
export const useLocalStorage = <
  T extends
    | string
    | number
    | boolean
    | Record<string, string | number | boolean | undefined>
    | Array<string | number | boolean>
    | undefined
>(
  key: string,
  initialValue: T,
  expire?: number
) => {
  interface Wrapper {
    value: T;
    lastModified: number;
  }

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [localValue, setLocalValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const wrapper = window.localStorage.getItem(key);
      const wrapped: Wrapper | undefined = wrapper ? JSON.parse(wrapper) : undefined;
      if (expire && wrapped && Date.now() > wrapped.lastModified + expire) {
        return initialValue;
      } else {
        return wrapped ? wrapped.value : initialValue;
      }
    } catch (error) {
      // If error also return initialValue
      logger.warn("Failed to get", key, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value: T) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        // Save state
        setLocalValue(value);
        // Save to local storage
        const wrapped: Wrapper = { value, lastModified: Date.now() };
        window.localStorage.setItem(key, JSON.stringify(wrapped));
      } catch (error) {
        // A more advanced implementation would handle the error case
        logger.warn("Failed to set", key, "to", value, error);
      }
    },
    [key]
  );

  return [localValue, setValue] as const;
};
