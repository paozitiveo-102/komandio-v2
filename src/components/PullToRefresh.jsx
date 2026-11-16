import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

const TRIGGER = 60;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const dist = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const onStart = (e) => {
      if (busy.current || window.scrollY > 0) return;
      start.current = e.touches[0].clientY;
    };

    const onMove = (e) => {
      if (start.current == null || busy.current) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) {
        start.current = null;
        dist.current = 0;
        setPull(0);
        return;
      }
      if (dy > 6 && e.cancelable) e.preventDefault();
      dist.current = Math.min(96, dy * 0.5);
      setPull(dist.current);
    };

    const onEnd = async () => {
      if (start.current == null) return;
      start.current = null;
      if (dist.current < TRIGGER) {
        dist.current = 0;
        setPull(0);
        return;
      }
      busy.current = true;
      setRefreshing(true);
      setPull(52);
      try {
        await onRefresh?.();
      } finally {
        busy.current = false;
        setRefreshing(false);
        dist.current = 0;
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh]);

  return (
    <div className="overscroll-contain">
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pull }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-terra" />
        ) : (
          <ArrowDown
            className="h-4 w-4 text-brand-terra/70"
            style={{ transform: `rotate(${Math.min(180, pull * 3)}deg)` }}
          />
        )}
      </div>
      {children}
    </div>
  );
}