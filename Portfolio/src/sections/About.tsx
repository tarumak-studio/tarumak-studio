import { about, profile } from '../content/site';
import { Reveal } from '../components/primitives';

export function About() {
  return (
    <section id="about" className="section tone-alt" aria-labelledby="about-title">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          <span className="eyebrow__index">01</span>
          <span className="eyebrow__rule" aria-hidden="true" />
          About
        </Reveal>

        <h2 id="about-title" className="visually-hidden">
          About {profile.name}
        </h2>
        <Reveal as="p" className="about__statement">
          {about.statement}
        </Reveal>

        <div className="about__grid">
          <Reveal className="about__portrait">
            <div className="portrait" role="img" aria-label={`Monogram portrait placeholder for ${profile.name}`}>
              <span className="portrait__mono">{profile.monogram}</span>
              <span className="portrait__caption">
                {profile.name}
                <br />
                {profile.location}
              </span>
            </div>
          </Reveal>

          <div className="about__body">
            {about.paragraphs.map((p, i) => (
              <Reveal as="p" key={p} delay={i * 80} className="lead">
                {p}
              </Reveal>
            ))}

            <Reveal delay={160}>
              <ul className="chips" aria-label="Sectors">
                {about.sectors.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <ul className="principles">
          {about.principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 90} className="principle">
              <span className="principle__index">0{i + 1}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
