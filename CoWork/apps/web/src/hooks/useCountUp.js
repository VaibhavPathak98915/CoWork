import { useEffect, useRef, useState } from "react";

/**
 * Animates a number towards its new value. Purely so a live update reads as an
 * event — a figure that silently swaps from 4 to 5 is easy to miss.
 */
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);

  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;
    if (from === target) return;

    let raf;
    const started = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return target == null ? null : value;
}
