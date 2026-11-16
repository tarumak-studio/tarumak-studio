import { createElement, useRef } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { useFinePointer, useInView, usePrefersReducedMotion } from '../hooks';

/* ---------- Reveal: fades content up when it scrolls into view ---------- */

interface RevealProps {
  children: ReactNode;
  as?: 'div' | 'li' | 'p' | 'span' | 'article' | 'header';
  className?: string;
  delay?: number;
}

export function Reveal({ children, as = 'div', className = '', delay = 0 }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      className: `reveal ${inView ? 'is-in' : ''} ${className}`.trim(),
      style: { '--delay': `${delay}ms` } as CSSProperties,
    },
    children,
  );
}

/* ---------- LineReveal: masked line-by-line heading animation ---------- */

interface LineRevealProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  emphasis?: number;
  id?: string;
}

export function LineReveal({ lines, as = 'h2', className = '', emphasis, id }: LineRevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return createElement(
    as,
    { ref, id, className: `lines ${inView ? 'is-in' : ''} ${className}`.trim() },
    lines.map((line, i) => (
      <span className="lines__mask" key={line}>
        <span className="lines__inner" style={{ '--i': i } as CSSProperties}>
          {i === emphasis ? <em>{line}</em> : line}
        </span>{' '}
      </span>
    )),
  );
}

/* ---------- SectionHeader: numbered eyebrow + title ---------- */

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: string[];
  titleId: string;
  emphasis?: number;
  children?: ReactNode;
}

export function SectionHeader({ index, eyebrow, title, titleId, emphasis, children }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <Reveal as="p" className="eyebrow">
        <span className="eyebrow__index">{index}</span>
        <span className="eyebrow__rule" aria-hidden="true" />
        {eyebrow}
      </Reveal>
      <LineReveal lines={title} className="display-2" id={titleId} emphasis={emphasis} />
      {children ? (
        <Reveal className="section-header__aside" delay={120}>
          {children}
        </Reveal>
      ) : null}
    </header>
  );
}

/* ---------- Magnetic: element leans toward the pointer ---------- */

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 0.28, className = '' }: MagneticProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <span ref={ref} className={`magnetic ${className}`.trim()} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </span>
  );
}

/* ---------- Marquee: endless ticker, paused for reduced motion ---------- */

export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item}>
          {item}
          <span className="marquee__star" aria-hidden="true">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee">
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/* ---------- Arrow icon ---------- */

export function Arrow({ direction = 'up-right' }: { direction?: 'up-right' | 'right' | 'left' | 'down' }) {
  const rotate = { 'up-right': -45, right: 0, left: 180, down: 90 }[direction];
  return (
    <svg className="arrow" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
