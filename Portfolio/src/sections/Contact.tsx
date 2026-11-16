import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { contact, profile, socials } from '../content/site';
import { Arrow, LineReveal, Magnetic, Reveal } from '../components/primitives';

interface FormValues {
  name: string;
  email: string;
  type: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = { name: '', email: '', type: contact.projectTypes[0] ?? '', message: '' };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.message.trim().length < 20) errors.message = 'Please share a little more detail (20 characters or more).';
  return errors;
}

export function Contact() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState<'' | 'email' | 'message'>('');
  const form = useRef<HTMLFormElement | null>(null);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as keyof FormValues]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as Array<keyof FormValues>)[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setDraft({
      subject: `Project enquiry: ${values.type} (${values.name.trim()})`,
      body: `${values.message.trim()}\n\n${values.name.trim()}\n${values.email.trim()}`,
    });
  };

  const copy = async (text: string, what: 'email' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(''), 2200);
    } catch {
      setCopied('');
    }
  };

  const mailto = draft
    ? `mailto:${profile.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
    : `mailto:${profile.email}`;

  const field = (name: keyof FormValues) => ({
    id: `field-${name}`,
    name,
    value: values[name],
    onChange: update,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `error-${name}` : undefined,
  });

  const error = (name: keyof FormValues) =>
    errors[name] ? (
      <p className="field__error" id={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          <span className="eyebrow__index">08</span>
          <span className="eyebrow__rule" aria-hidden="true" />
          Contact
        </Reveal>
        <LineReveal lines={contact.heading} className="display-1" id="contact-title" emphasis={1} />

        <div className="contact__grid">
          <Reveal className="contact__aside">
            <p className="lead">{contact.intro}</p>

            <div className="contact__email">
              <span className="meta">Email</span>
              <a className="contact__address link-underline" href={mailto}>
                {profile.email}
              </a>
              <button type="button" className="text-btn" onClick={() => copy(profile.email, 'email')}>
                {copied === 'email' ? 'Copied' : 'Copy address'}
              </button>
            </div>

            <div>
              <span className="meta">Elsewhere</span>
              <ul className="socials">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a className="link-underline" href={s.href} target="_blank" rel="noreferrer noopener">
                      {s.label} <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            {draft ? (
              <div className="draft" role="status">
                <h3>Your message is ready to send</h3>
                <p>
                  This site does not send mail on its own. Open the draft in your email app, or copy it and send it to{' '}
                  <strong>{profile.email}</strong>.
                </p>
                <pre className="draft__body">{`${draft.subject}\n\n${draft.body}`}</pre>
                <div className="draft__actions">
                  <a className="btn btn--primary" href={mailto}>
                    Open in email app <Arrow />
                  </a>
                  <button type="button" className="btn btn--ghost" onClick={() => copy(`${draft.subject}\n\n${draft.body}`, 'message')}>
                    {copied === 'message' ? 'Copied' : 'Copy message'}
                  </button>
                  <button type="button" className="text-btn" onClick={() => setDraft(null)}>
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <form ref={form} className="form" onSubmit={onSubmit} noValidate aria-label="Project enquiry">
                <div className="field">
                  <label htmlFor="field-name">Your name</label>
                  <input type="text" autoComplete="name" required {...field('name')} />
                  {error('name')}
                </div>
                <div className="field">
                  <label htmlFor="field-email">Email</label>
                  <input type="email" autoComplete="email" inputMode="email" required {...field('email')} />
                  {error('email')}
                </div>
                <div className="field field--wide">
                  <label htmlFor="field-type">What do you need?</label>
                  <select {...field('type')}>
                    {contact.projectTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field field--wide">
                  <label htmlFor="field-message">About the project</label>
                  <textarea rows={5} required {...field('message')} />
                  {error('message')}
                </div>
                <div className="field--wide">
                  <Magnetic>
                    <button type="submit" className="btn btn--primary btn--large">
                      Prepare message <Arrow />
                    </button>
                  </Magnetic>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__mark" aria-hidden="true">
          {profile.name}
        </p>
        <div className="footer__row">
          <p className="meta">
            © {new Date().getFullYear()} {profile.name}. {profile.title}.
          </p>
          <p className="meta">{profile.location}</p>
          <a className="meta link-underline" href="#top">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
