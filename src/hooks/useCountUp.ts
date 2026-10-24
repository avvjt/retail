import { useState, useEffect } from 'react';

export function useCountUp(endValue: number, duration = 2000, inView = true, decimals = 0): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - percentage, 4);

      const currentVal = easeOut * endValue;
      setCount(decimals > 0 ? parseFloat(currentVal.toFixed(decimals)) : Math.floor(currentVal));

      if (progress < duration) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setCount(decimals > 0 ? parseFloat(Number(endValue).toFixed(decimals)) : endValue);
      }
    };

    animationFrame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [endValue, duration, inView, decimals]);

  return count;
}
