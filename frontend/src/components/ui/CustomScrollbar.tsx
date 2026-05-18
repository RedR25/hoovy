import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 100% custom window scrollbar. Native bars are hidden via global CSS
 * (see styles/index.css); this component reads `document.documentElement`
 * dimensions and `window.scrollY` to draw a thumb on the right edge.
 *
 * Supports click-and-drag on the thumb to scroll.
 *
 * No track is rendered — just the thumb pill on its own. Auto-hides when
 * the page content doesn't overflow the viewport.
 */
export function CustomScrollbar() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const [dragging, setDragging] = useState(false);

  // Drag bookkeeping: where the mouse grabbed the thumb (px from thumb top)
  // and a snapshot of the doc geometry so the math is stable while dragging.
  const dragRef = useRef<{
    grabOffset: number;
    trackHeight: number;
    docMax: number;
    thumbHeight: number;
  } | null>(null);

  const TRACK_INSET = 12; // px between the track and viewport edges (top/bottom)
  const MIN_THUMB = 36;   // px — keep the thumb grabbable on long pages

  const recompute = useCallback(() => {
    const doc = document.documentElement;
    const viewport = window.innerHeight;
    const docHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
    const docMax = docHeight - viewport;

    if (docMax <= 1) {
      setOverflow(false);
      return;
    }
    setOverflow(true);

    const trackHeight = viewport - TRACK_INSET * 2;
    const rawThumbHeight = (viewport / docHeight) * trackHeight;
    const thumbHeight = Math.max(MIN_THUMB, Math.min(trackHeight, rawThumbHeight));

    const scrollY = window.scrollY || doc.scrollTop;
    const progress = docMax > 0 ? scrollY / docMax : 0;
    const top = progress * (trackHeight - thumbHeight);

    setThumb({ top, height: thumbHeight });
  }, []);

  // Observe scroll + resize + DOM mutations (route changes, lazy content).
  useEffect(() => {
    recompute();

    const onScroll = () => recompute();
    const onResize = () => recompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(recompute);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);

    const mo = new MutationObserver(recompute);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      mo.disconnect();
    };
  }, [recompute]);

  // Drag handlers — live at the window level so the gesture isn't lost
  // when the cursor exits the thumb.
  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const trackRect = trackEl.getBoundingClientRect();
      const doc = document.documentElement;
      const viewport = window.innerHeight;
      const docHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
      const docMax = docHeight - viewport;
      dragRef.current = {
        grabOffset: e.clientY - (trackRect.top + thumb.top),
        trackHeight: trackRect.height,
        docMax,
        thumbHeight: thumb.height,
      };
      setDragging(true);
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [thumb.top, thumb.height],
  );

  const onThumbPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const trackTop = trackEl.getBoundingClientRect().top;
      const maxThumbTop = drag.trackHeight - drag.thumbHeight;
      const rawTop = e.clientY - trackTop - drag.grabOffset;
      const clamped = Math.max(0, Math.min(maxThumbTop, rawTop));
      const progress = maxThumbTop > 0 ? clamped / maxThumbTop : 0;
      window.scrollTo({ top: progress * drag.docMax, behavior: "auto" });
    },
    [],
  );

  const onThumbPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    try {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  }, []);

  if (!overflow) return null;

  return (
    <div
      ref={trackRef}
      aria-hidden
      className="fixed right-2 z-[60] pointer-events-none"
      style={{
        top: TRACK_INSET,
        bottom: TRACK_INSET,
        width: 8,
      }}
    >
      <div
        role="scrollbar"
        aria-orientation="vertical"
        onPointerDown={onThumbPointerDown}
        onPointerMove={onThumbPointerMove}
        onPointerUp={onThumbPointerUp}
        onPointerCancel={onThumbPointerUp}
        className="pointer-events-auto absolute left-0 right-0 cursor-grab active:cursor-grabbing"
        style={{
          top: thumb.top,
          height: thumb.height,
          borderRadius: 9999,
          background:
            "linear-gradient(180deg, #6FD1FF 0%, #47C2FF 60%, #1FA3E6 100%)",
          transform: dragging ? "scaleX(1.25)" : "scaleX(1)",
          transformOrigin: "center",
          transition: "transform 120ms ease",
        }}
      />
    </div>
  );
}
