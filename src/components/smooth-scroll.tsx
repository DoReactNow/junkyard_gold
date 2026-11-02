"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Eased wheel scrolling on the public site (off in /admin and for reduced motion; touch stays native),
 * and every new page opens at the very top. Next.js only scrolls to where the page content starts,
 * which leaves the top bar out of view; Back and Forward keep the browser's restored position.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const lenis = useRef<Lenis | null>(null);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => (popped.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (admin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 });
    lenis.current = l;
    return () => {
      l.destroy();
      lenis.current = null;
    };
  }, [admin]);

  useEffect(() => {
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (window.location.hash) return;
    // after Next.js has done its own scroll for this navigation
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      lenis.current?.scrollTo(0, { immediate: true, force: true });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
