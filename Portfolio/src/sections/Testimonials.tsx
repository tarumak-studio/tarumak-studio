import { useState } from 'react';
import { testimonials } from '../content/site';
import { Arrow, Reveal, SectionHeader } from '../components/primitives';

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const current = testimonials[index];
  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  if (!current) return null;

  return (
    <section id="testimonials" className="section" aria-labelledby="testimonials-title">
      <div className="container">
        <SectionHeader index="07" eyebrow="Testimonials" title={['In their', 'words']} titleId="testimonials-title" emphasis={1} />

        <Reveal className="quotes">
          <div className="quotes__stage" role="group" aria-roledescription="carousel" aria-label="Client testimonials">
            <span className="quotes__mark" aria-hidden="true">
              “
            </span>
            <div aria-live="polite" aria-atomic="true">
              <figure className="quote" key={current.id}>
                <blockquote>
                  <p>{current.quote}</p>
                </blockquote>
                <figcaption>
                  <span className="quote__author">{current.author}</span>
                  <span className="quote__role">{current.role}</span>
                  {current.placeholder ? <span className="tag">Placeholder quote</span> : null}
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="quotes__controls">
            <p className="meta" aria-hidden="true">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </p>
            <div className="quotes__bars" aria-hidden="true">
              {testimonials.map((t, i) => (
                <span key={t.id} className={i === index ? 'is-on' : ''} />
              ))}
            </div>
            <div className="quotes__buttons">
              <button type="button" className="round-btn" onClick={() => step(-1)} aria-label="Previous testimonial">
                <Arrow direction="left" />
              </button>
              <button type="button" className="round-btn" onClick={() => step(1)} aria-label="Next testimonial">
                <Arrow direction="right" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
