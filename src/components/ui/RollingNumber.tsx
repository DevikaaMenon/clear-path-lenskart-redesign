"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/pricing";

/**
 * Lensmeter readout: a price that counts to its new value (~420ms) so the user
 * sees that their choice changed it. Screen readers only get the final value.
 */
export function RollingPrice({ value, className = "", prefix = "" }: { value: number; className?: string; prefix?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (reduce || prev.current === value) {
      setShown(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <span className={`num tabular-nums ${className}`}>
      <span aria-hidden="true">
        {prefix}
        {formatINR(shown)}
      </span>
      <span className="sr-only">
        {prefix}
        {formatINR(value)}
      </span>
    </span>
  );
}
