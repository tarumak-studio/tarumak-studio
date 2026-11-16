import { useRef } from 'react';
import { processSteps } from '../content/site';
import { useScrollFrame } from '../hooks';
import { Reveal, SectionHeader } from '../components/primitives';

export function Process() {
  const list = useRef<HTMLOListElement | null>(null);

  // Fill the timeline rail and light up steps as the list passes mid-screen.
  useScrollFrame(() => {
    const el = list.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const anchor = window.innerHeight * 0.6;
    const progress = Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1);
    el.style.setProperty('--progress', progress.toFixed(3));
    Array.from(el.children).forEach((child) => {
      child.classList.toggle('is-active', child.getBoundingClientRect().top < anchor);
    });
  });

  return (
    <section id="process" className="section" aria-labelledby="process-title">
      <div className="container process">
        <div className="process__intro">
          <SectionHeader index="05" eyebrow="Creative process" title={['Five steps,', 'no surprises']} titleId="process-title" emphasis={1}>
            <p>A clear path from first call to final files, so you always know what happens next.</p>
          </SectionHeader>
        </div>

        <ol className="steps" ref={list}>
          {processSteps.map((step, i) => (
            <li key={step.id} className="step">
              <span className="step__node" aria-hidden="true" />
              <Reveal>
                <span className="step__index">Step 0{i + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__summary">{step.summary}</p>
                <ul className="chips chips--small" aria-label={`${step.title} outputs`}>
                  {step.outputs.map((o) => (
                    <li key={o} className="chip">
                      {o}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
