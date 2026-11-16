import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { hero, heroFacts, profile } from '../content/site';
import { scrollToSection, useClock, usePrefersReducedMotion } from '../hooks';
import { Arrow, Magnetic, Marquee } from '../components/primitives';

export function Hero() {
  const time = useClock(profile.timeZone);
  const reduced = usePrefersReducedMotion();

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection(id, reduced);
  };

  return (
    <section id="top" className="hero" aria-labelledby="hero-title" onPointerMove={onPointerMove}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__meta">
          <p className="meta">
            <span className="status-dot" aria-hidden="true" />
            {profile.availability}
          </p>
          <p className="meta hero__meta-mid">{hero.eyebrow}</p>
          <p className="meta">
            {profile.location.split(',')[0]}, India
            {time ? (
              <>
                {' · '}
                <time>{time}</time> {profile.timeZoneLabel}
              </>
            ) : null}
          </p>
        </div>

        <h1 id="hero-title" className="hero__title">
          {hero.lines.map((line, i) => (
            <span className="hero__line" key={line}>
              <span style={{ '--i': i } as CSSProperties}>{i === hero.emphasisLine ? <em>{line}</em> : line}</span>{' '}
            </span>
          ))}
        </h1>

        <div className="hero__foot">
          <p className="hero__intro">{hero.intro}</p>

          <div className="hero__actions">
            <Magnetic>
              <a className="btn btn--primary" href="#work" onClick={go('work')}>
                View selected work <Arrow direction="down" />
              </a>
            </Magnetic>
            <a className="btn btn--ghost" href="#contact" onClick={go('contact')}>
              Start a project <Arrow />
            </a>
          </div>

          <div className="badge" aria-hidden="true">
            <svg viewBox="0 0 200 200">
              <defs>
                <path id="badge-circle" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
              </defs>
              <text>
                <textPath href="#badge-circle">Digital designer ✦ Creative director ✦ Est. 15+ years ✦</textPath>
              </text>
            </svg>
            <span className="badge__core">{profile.monogram}</span>
          </div>
        </div>

        <dl className="hero__facts">
          {heroFacts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Marquee items={hero.marquee} />
    </section>
  );
}
