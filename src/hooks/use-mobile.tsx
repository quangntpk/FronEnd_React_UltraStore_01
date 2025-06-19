
import * as React from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

/**
 * React hook to check if the viewport is at a specific breakpoint or smaller
 * @param breakpoint - The breakpoint to check against ('mobile', 'tablet', 'desktop')
 * @returns Boolean indicating if the viewport is at that breakpoint or smaller
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS = "mobile") {
  const [isBreakpoint, setIsBreakpoint] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
    
    const onChange = () => {
      setIsBreakpoint(mql.matches);
    };
    
    // Modern browsers
    mql.addEventListener("change", onChange);
    setIsBreakpoint(mql.matches);
    
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return !!isBreakpoint;
}

// Legacy function for backward compatibility
export function useIsMobile() {
  return useBreakpoint("mobile");
}

// Helper hooks for other breakpoints
export function useIsTablet() {
  return useBreakpoint("tablet");
}

export function useIsDesktop() {
  return !useBreakpoint("desktop");
}
