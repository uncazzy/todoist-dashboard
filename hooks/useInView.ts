import { useEffect, useState, useRef } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
  /**
   * Number of viewport heights to load ahead. 
   * e.g., 2 means start loading when item is 2 viewport heights away
   */
  viewportBufferFactor?: number;
  /**
   * Keep component rendered after it's been viewed once
   */
  keepRendered?: boolean;
}

export function useInView(options: UseInViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);
  const [wasEverInView, setWasEverInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Calculate rootMargin based on viewport height
    const viewportHeight = window.innerHeight;
    const bufferFactor = options.viewportBufferFactor ?? 2;
    const bufferPixels = Math.round(viewportHeight * bufferFactor);
    
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setWasEverInView(true);
        }
      }
    }, {
      ...options,
      rootMargin: `${bufferPixels}px 0px`,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.viewportBufferFactor]);

  const shouldRender = options.keepRendered ? (isInView || wasEverInView) : isInView;

  return [elementRef, shouldRender] as const;
}
