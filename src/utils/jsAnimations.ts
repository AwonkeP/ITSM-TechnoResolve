import { useEffect, useRef, useState } from 'react';

/**
 * Pure JavaScript requestAnimationFrame number counter hook
 * Smoothly interpolates numeric changes without abrupt jumps.
 */
export function useAnimatedCounter(target: number, duration = 420): number {
  const [count, setCount] = useState<number>(target);
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    const endValue = target;
    prevTargetRef.current = target;

    if (startValue === endValue) {
      setCount(endValue);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCount(endValue);
      return;
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

/**
 * Subtle JavaScript Web Animations API fade-and-slide transition for container updates
 */
export function animateCalmFadeSlide(el: HTMLElement | null) {
  if (!el || typeof el.animate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  el.animate(
    [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0px)' },
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }
  );
}

/**
 * Subtle JavaScript feedback pulse for status or assignment changes
 */
export function triggerElementPop(el: HTMLElement | null) {
  if (!el || typeof el.animate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  el.animate(
    [
      { opacity: 0.85, transform: 'translateY(2px)' },
      { opacity: 1, transform: 'translateY(0px)' },
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }
  );
}
