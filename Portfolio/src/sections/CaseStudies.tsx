import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { caseStudies, projects } from '../content/site';
import { Artwork } from '../components/Artwork';
import { Reveal, SectionHeader } from '../components/primitives';

export function CaseStudies() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const study = caseStudies[active];
  const project = projects.find((p) => p.id === study?.projectId);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = caseStudies.length - 1;
    let next = active;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  if (!study) return null;

  return (
    <section id="cases" className="section tone-alt" aria-labelledby="cases-title">
      <div className="container">
        <SectionHeader index="04" eyebrow="Case studies" title={['The thinking', 'behind the work']} titleId="cases-title" emphasis={1}>
          <p>Three projects, opened up: the problem, the approach and what changed.</p>
        </SectionHeader>

        <Reveal className="cases">
          <div className="cases__tabs" role="tablist" aria-label="Case studies" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {caseStudies.map((cs, i) => (
              <button
                key={cs.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${cs.id}`}
                aria-selected={i === active}
                aria-controls="case-panel"
                tabIndex={i === active ? 0 : -1}
                className="cases__tab"
                onClick={() => setActive(i)}
              >
                <span className="cases__tab-index">0{i + 1}</span>
                <span>
                  <span className="cases__tab-kicker">{cs.kicker}</span>
                  <span className="cases__tab-title">{projects.find((p) => p.id === cs.projectId)?.title}</span>
                </span>
              </button>
            ))}
          </div>

          <div id="case-panel" role="tabpanel" aria-labelledby={`tab-${study.id}`} tabIndex={0} className="case" key={study.id}>
            {project ? (
              <div className="case__art">
                <Artwork kind={project.art} palette={project.palette} title={project.title} />
              </div>
            ) : null}
            <h3 className="case__title">{study.title}</h3>

            <dl className="case__facts">
              {study.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="case__story">
              <div>
                <h4>Challenge</h4>
                <p>{study.challenge}</p>
              </div>
              <div>
                <h4>Approach</h4>
                <p>{study.approach}</p>
              </div>
              <div>
                <h4>Outcome</h4>
                <p>{study.outcome}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
