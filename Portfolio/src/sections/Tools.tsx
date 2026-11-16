import { toolGroups } from '../content/site';
import { Reveal, SectionHeader } from '../components/primitives';

export function Tools() {
  return (
    <section id="tools" className="section tone-alt" aria-labelledby="tools-title">
      <div className="container">
        <SectionHeader index="06" eyebrow="Tools" title={['The toolkit']} titleId="tools-title">
          <p>Tools change. The judgement behind them is what you are hiring.</p>
        </SectionHeader>

        <div className="tools">
          {toolGroups.map((group, i) => (
            <Reveal key={group.id} delay={i * 70} className="tool-group">
              <h3>{group.title}</h3>
              <p className="tool-group__note">{group.note}</p>
              <ul>
                {group.tools.map((tool) => (
                  <li key={tool} className="tool">
                    <span className="tool__glyph" aria-hidden="true">
                      {tool.replace('Adobe ', '').slice(0, 2)}
                    </span>
                    {tool}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
