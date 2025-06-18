import { useMediaQuery } from "react-responsive";
import defaultTheme from "tailwindcss/defaultTheme";

const breakpoints = defaultTheme.screens;

/**
 * Returns `true` if screen size matches the `breakpoint`.
 */
export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const breakpointQuery = breakpoints[breakpoint];
  return useMediaQuery({ query: `(min-width: ${breakpointQuery})` });
};
