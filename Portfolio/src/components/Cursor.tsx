import { useEffect, useRef, useState } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks';

/**
 * Decorative trailing cursor. It follows the native pointer (which stays
 * visible) and shows a label for any ancestor carrying `data-cursor`.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [label, setLabel] = useState('');
  const [state, setState] = useState<'idle' | 'link' | 'label'>('idle');
  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let x = -100;
    let y = -100;
    let tx = x;
    let ty = y;
    let frame = 0;

    const tick = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add('is-visible');
      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest<HTMLElement>('[data-cursor]');
      if (labelled) {
        setLabel(labelled.dataset.cursor ?? '');
        setState('label');
      } else if (target?.closest('a, button, [role="tab"], input, textarea, select, summary')) {
        setState('link');
      } else {
        setState('idle');
      }
    };
    const onLeave = () => el.classList.remove('is-visible');

    frame = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ref} className={`cursor cursor--${state}`} aria-hidden="true">
      <span className="cursor__dot">
        <span className="cursor__label">{state === 'label' ? label : ''}</span>
      </span>
    </div>
  );
}
