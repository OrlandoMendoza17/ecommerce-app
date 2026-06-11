import { RefObject, useEffect, useRef, useState } from "react";

const PARALLAX_FACTOR = 0.35;

export function useParallaxOffset(ref: RefObject<HTMLElement | null>) {
  const [offset, setOffset] = useState(0);
  const initialTopRef = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let frame = 0;
    initialTopRef.current = null;

    const update = () => {
      frame = 0;
      const { top } = element.getBoundingClientRect();

      if (initialTopRef.current === null) {
        initialTopRef.current = top;
      }

      setOffset((top - initialTopRef.current) * PARALLAX_FACTOR);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ref]);

  return offset;
}
