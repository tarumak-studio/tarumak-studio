import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { nav, profile } from '../content/site';
import { scrollToSection, useActiveSection, usePrefersReducedMotion, useScrollFrame } from '../hooks';
import type { Theme } from '../hooks';
import { Magnetic } from './primitives';

interface NavProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function Nav({ theme, onToggleTheme }: NavProps) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const progress = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const active = useActiveSection(nav.map((l) => l.id));

  useScrollFrame(() => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    setScrolled(y > 24);
    setHidden(y > 320 && y > lastY.current + 4 ? true : y < lastY.current - 4 ? false : (h) => h);
    lastY.current = y;
  });

  useEffect(() => {
    document.body.classList.toggle('is-locked', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    // Wait a frame so the scroll lock is released before scrolling.
    requestAnimationFrame(() => scrollToSection(id, reduced));
  };

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className={`nav ${hidden && !open ? 'is-hidden' : ''} ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <span ref={progress} className="nav__progress" aria-hidden="true" />
      <div className="nav__bar container">
        <a className="nav__brand" href="#top" onClick={go('top')} aria-label={`${profile.name}, back to top`}>
          <span className="nav__mono" aria-hidden="true">
            {profile.monogram}
          </span>
          <span className="nav__name">{profile.name}</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          <ul>
            {nav.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} onClick={go(link.id)} aria-current={active === link.id ? 'true' : undefined} className="link-underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${nextTheme} theme`}>
            <span className="theme-toggle__icon" aria-hidden="true" />
          </button>
          <Magnetic className="nav__cta-wrap">
            <a className="btn btn--small" href="#contact" onClick={go('contact')}>
              Let’s talk
            </a>
          </Magnetic>
          <button
            type="button"
            className="nav__burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="menu" hidden={!open}>
        <nav aria-label="Mobile">
          <ul>
            {nav.map((link, i) => (
              <li key={link.id} style={{ animationDelay: `${60 + i * 50}ms` }}>
                <a href={`#${link.id}`} onClick={go(link.id)}>
                  <span className="menu__index">0{i + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="menu__foot">
          {profile.location}
          <br />
          {profile.email}
        </p>
      </div>
    </header>
  );
}
