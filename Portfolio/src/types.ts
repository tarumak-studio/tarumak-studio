export type Discipline = 'Brand' | 'Web' | 'Marketing' | 'Motion' | 'Print' | 'Product';

export type ArtKind = 'web' | 'system' | 'print' | 'brand' | 'product' | 'finance';

export interface Palette {
  bg: string;
  fg: string;
  accent: string;
}

export interface Project {
  id: string;
  title: string;
  sector: string;
  summary: string;
  detail: string;
  role: string;
  disciplines: Discipline[];
  deliverables: string[];
  art: ArtKind;
  palette: Palette;
  /** True when the entry is sample content to be replaced. */
  placeholder?: boolean;
}

export interface Fact {
  value: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  projectId: string;
  title: string;
  kicker: string;
  challenge: string;
  approach: string;
  outcome: string;
  facts: Fact[];
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export interface ProcessStep {
  id: string;
  title: string;
  summary: string;
  outputs: string[];
}

export interface ToolGroup {
  id: string;
  title: string;
  note: string;
  tools: string[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  placeholder?: boolean;
}

export interface NavLink {
  id: string;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
}
