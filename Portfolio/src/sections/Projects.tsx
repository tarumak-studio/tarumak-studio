import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { projects } from '../content/site';
import type { Discipline, Project } from '../types';
import { useFinePointer, usePrefersReducedMotion } from '../hooks';
import { Artwork } from '../components/Artwork';
import { Arrow, Reveal, SectionHeader } from '../components/primitives';

type Filter = 'All' | Discipline;

export function Projects() {
  const [filter, setFilter] = useState<Filter>('All');
  const [hovered, setHovered] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const preview = useRef<HTMLDivElement | null>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  const filters = useMemo<Filter[]>(() => {
    const set = new Set<Discipline>();
    projects.forEach((p) => p.disciplines.forEach((d) => set.add(d)));
    return ['All', ...set];
  }, []);

  const visible = filter === 'All' ? projects : projects.filter((p) => p.disciplines.includes(filter));

  const onMove = (e: PointerEvent<HTMLUListElement>) => {
    if (!preview.current || !fine) return;
    preview.current.style.setProperty('--x', `${e.clientX}px`);
    preview.current.style.setProperty('--y', `${e.clientY}px`);
  };

  return (
    <section id="work" className="section section--ruled" aria-labelledby="work-title">
      <div className="container">
        <SectionHeader index="03" eyebrow="Selected projects" title={['Selected', 'work']} titleId="work-title" emphasis={1}>
          <div className="filters" role="group" aria-label="Filter projects by discipline">
            {filters.map((f) => (
              <button key={f} type="button" className="filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </SectionHeader>

        <p className="visually-hidden" role="status">
          Showing {visible.length} {visible.length === 1 ? 'project' : 'projects'}
        </p>

        <ul className="projects" onPointerMove={onMove} onPointerLeave={() => setHovered(null)}>
          {visible.map((project, i) => (
            <Reveal as="li" key={project.id} delay={i * 50} className="project">
              <button
                type="button"
                className="project__row"
                data-cursor="View"
                aria-haspopup="dialog"
                onPointerEnter={() => setHovered(project)}
                onFocus={() => setHovered(null)}
                onClick={() => setSelected(project)}
              >
                <span className="project__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="project__thumb">
                  <Artwork kind={project.art} palette={project.palette} title={project.title} />
                </span>
                <span className="project__main">
                  <span className="project__title">
                    {project.title}
                    {project.placeholder ? <span className="tag">Placeholder</span> : null}
                  </span>
                  <span className="project__summary">{project.summary}</span>
                </span>
                <span className="project__meta">
                  <span>{project.sector}</span>
                  <span>{project.disciplines.join(' · ')}</span>
                </span>
                <span className="project__arrow">
                  <Arrow />
                </span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      {fine && !reduced ? (
        <div ref={preview} className={`preview ${hovered ? 'is-on' : ''}`} aria-hidden="true">
          {projects.map((p) => (
            <div key={p.id} className={`preview__item ${hovered?.id === p.id ? 'is-on' : ''}`}>
              <Artwork kind={p.art} palette={p.palette} title={p.title} />
            </div>
          ))}
        </div>
      ) : null}

      <ProjectDialog project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

interface ProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  };

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onClose={onClose} onClick={onBackdrop}>
      {project ? (
        <article className="dialog__panel">
          <form method="dialog" className="dialog__close">
            <button type="submit" className="round-btn" aria-label="Close project details">
              <span aria-hidden="true">×</span>
            </button>
          </form>
          <div className="dialog__art">
            <Artwork kind={project.art} palette={project.palette} title={project.title} />
          </div>
          <div className="dialog__body">
            <p className="meta">
              {project.sector}
              {project.placeholder ? ' · Placeholder' : ''}
            </p>
            <h3 id="dialog-title" className="dialog__title">
              {project.title}
            </h3>
            <p className="lead">{project.detail}</p>
            <dl className="dialog__facts">
              <div>
                <dt>Role</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Disciplines</dt>
                <dd>{project.disciplines.join(', ')}</dd>
              </div>
              <div>
                <dt>Deliverables</dt>
                <dd>
                  <ul>
                    {project.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <form method="dialog">
              <button className="btn btn--primary" type="submit">
                Close
              </button>
            </form>
          </div>
        </article>
      ) : null}
    </dialog>
  );
}
