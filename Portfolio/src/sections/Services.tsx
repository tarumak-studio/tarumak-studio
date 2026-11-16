import { useState } from 'react';
import { services } from '../content/site';
import { Reveal, SectionHeader } from '../components/primitives';

export function Services() {
  const [openId, setOpenId] = useState<string>(services[0]?.id ?? '');

  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <div className="container">
        <SectionHeader index="02" eyebrow="Services" title={['What I can', 'do for you']} titleId="services-title" emphasis={1}>
          <p>Engage me for a single discipline or as one senior partner across all of them.</p>
        </SectionHeader>

        <ul className="services">
          {services.map((service, i) => {
            const open = openId === service.id;
            const panelId = `service-panel-${service.id}`;
            const buttonId = `service-button-${service.id}`;
            return (
              <Reveal as="li" key={service.id} delay={i * 50} className={`service ${open ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    className="service__head"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? '' : service.id)}
                  >
                    <span className="service__index">0{i + 1}</span>
                    <span className="service__title">{service.title}</span>
                    <span className="service__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} className="service__panel" inert={!open}>
                  <div className="service__panel-inner">
                    <p className="service__summary">{service.summary}</p>
                    <ul className="service__items">
                      {service.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
