import { useState, useEffect } from 'react';

export function useCountUp(end: number, duration: number = 800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const parsedDuration = Number(duration);
    const normalizedDuration = Number.isFinite(parsedDuration) ? parsedDuration : 0;
    const shouldAnimate = normalizedDuration > 0;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = shouldAnimate ? Math.min(elapsed / normalizedDuration, 1) : 1;

      // Ease-out curve for natural feel
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}
