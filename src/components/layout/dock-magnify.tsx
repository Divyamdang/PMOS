"use client";

import * as React from "react";

const MAX_SCALE = 1.14;
const BASE_SCALE = 1;
const RADIUS = 64; // px — how far the cursor's pull reaches

/** macOS-dock-style proximity magnification. Wrap a vertical list of items
 * (each marked with `data-dock-item`) and items near the cursor scale up
 * with a smooth falloff, exactly like hovering along the Dock. Uses direct
 * DOM style writes (not React state) so it stays smooth at 60fps — a
 * mousemove-driven re-render for every item, every frame, would not. */
export function DockMagnifyContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<number | null>(null);

  function applyMagnify(clientY: number) {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-dock-item]");
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - itemCenterY);
      const influence = Math.max(0, 1 - distance / RADIUS);
      const eased = influence * influence * (3 - 2 * influence); // smoothstep falloff
      const scale = BASE_SCALE + (MAX_SCALE - BASE_SCALE) * eased;
      item.style.transform = `scale(${scale})`;
      item.style.zIndex = eased > 0.05 ? "10" : "0";
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const clientY = e.clientY;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => applyMagnify(clientY));
  }

  function handleMouseLeave() {
    const container = containerRef.current;
    if (!container) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    container.querySelectorAll<HTMLElement>("[data-dock-item]").forEach((item) => {
      item.style.transform = "scale(1)";
      item.style.zIndex = "0";
    });
  }

  return (
    <div ref={containerRef} className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}
