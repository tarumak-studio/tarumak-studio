import type {
  CaseStudy,
  Fact,
  NavLink,
  ProcessStep,
  Project,
  Service,
  SocialLink,
  Testimonial,
  ToolGroup,
} from '../types';

/**
 * Single source of truth for all copy on the site.
 * Edit this file to change content; no component needs to be touched.
 */

export const profile = {
  name: 'Sudhir Kumar',
  monogram: 'SK',
  title: 'Digital Designer & Creative Director',
  location: 'Ambala, Haryana, India',
  timeZone: 'Asia/Kolkata',
  timeZoneLabel: 'IST',
  // TODO: replace with your public contact address and site URL.
  email: 'hello@yourdomain.com',
  url: 'https://yourdomain.com',
  availability: 'Booking select projects',
  description:
    'Sudhir Kumar is an independent digital designer and creative director with 15+ years of experience building brands, websites and motion for hospitality, finance and consumer companies worldwide.',
};

export const nav: NavLink[] = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Work' },
  { id: 'cases', label: 'Case studies' },
  { id: 'process', label: 'Process' },
  { id: 'contact', label: 'Contact' },
];

export const hero = {
  eyebrow: 'Independent design practice',
  lines: ['Considered design', 'for brands that', 'refuse to blend in.'],
  emphasisLine: 2,
  intro:
    'I am Sudhir Kumar, a digital designer and creative director. For 15+ years I have shaped identities, websites and campaigns for hospitality, finance and consumer brands around the world.',
  marquee: [
    'Brand identity',
    'Website design',
    'UI / UX',
    'Campaign systems',
    'Motion & promo video',
    'Print collateral',
    'Creative direction',
  ],
};

export const heroFacts: Fact[] = [
  { value: '15+', label: 'Years in practice' },
  { value: '03', label: 'Core sectors: hospitality, finance, consumer' },
  { value: '01', label: 'Point of contact, from brief to delivery' },
];

export const about = {
  statement:
    'Good design is a business decision made visible. I work where strategy, craft and production meet, so the idea that wins the room is the same one that ships.',
  paragraphs: [
    'I work independently and directly with founders and marketing teams, mostly across time zones. That means no layers between the brief and the person doing the work, and a single consistent hand across logo, website, campaign and motion.',
    'Fifteen years in, my practice has widened from pixels to systems: template libraries that whole member communities use, print kits that hold up on a convention floor, and products I design and build myself.',
  ],
  principles: [
    { title: 'Clarity before decoration', text: 'Every screen and page should make its point in seconds.' },
    { title: 'Systems over one-offs', text: 'Tokens, templates and rules that keep a brand consistent after handover.' },
    { title: 'Made to be used', text: 'Files, components and guides that real teams can pick up and run with.' },
  ],
  sectors: ['Hospitality', 'Finance', 'Consumer brands'],
};

export const services: Service[] = [
  {
    id: 'brand',
    title: 'Brand identity',
    summary: 'Logo systems and visual languages built to stretch from a favicon to a trade-show wall.',
    items: ['Logo & mark systems', 'Colour, type & tone', 'Brand guidelines', 'Naming support'],
  },
  {
    id: 'web',
    title: 'Website & UI/UX design',
    summary: 'Marketing sites and product interfaces that are clear, fast to scan and easy to build.',
    items: ['Information architecture', 'Wireframes & prototypes', 'High-fidelity UI', 'Design handoff'],
  },
  {
    id: 'marketing',
    title: 'Campaign & marketing design',
    summary: 'Funnels, banners and collateral designed as one system rather than a pile of assets.',
    items: ['Funnel graphics', 'Social & ad sets', 'Print collateral', 'Template libraries'],
  },
  {
    id: 'motion',
    title: 'Motion & promo video',
    summary: 'Short, editable promo films that turn static campaigns into something people watch.',
    items: ['15–20 second promos', 'Animated templates', 'Sound & pacing', 'Editable masters'],
  },
  {
    id: 'systems',
    title: 'Design systems',
    summary: 'Tokens, components and documentation that keep teams shipping on-brand without me.',
    items: ['Design tokens', 'Component libraries', 'Usage guidelines', 'Team onboarding'],
  },
  {
    id: 'direction',
    title: 'Creative direction',
    summary: 'A senior eye across a launch or rebrand: setting the idea, the bar and the details.',
    items: ['Concept & art direction', 'Design reviews', 'Vendor coordination', 'Quality control'],
  },
];

export const projects: Project[] = [
  {
    id: 'marketing-boost',
    title: 'Marketing Boost',
    sector: 'Marketing platform',
    summary: 'A member graphics library across four funnels, extended into editable promo videos.',
    detail:
      'Ongoing design partnership maintaining the member graphics library: four funnels of campaign assets and niche template sets for travel agents, real estate, taxation and solar, now being animated into editable promo videos.',
    role: 'Lead designer',
    disciplines: ['Marketing', 'Motion'],
    deliverables: ['Funnel graphics library', 'Niche template sets', 'Animated promo templates', 'Quality review workflow'],
    art: 'system',
    palette: { bg: '#141a2e', fg: '#eef1ff', accent: '#7c8cff' },
  },
  {
    id: 'trustbyreviews',
    title: 'TrustByReviews',
    sector: 'Hospitality technology',
    summary: 'A complete print collateral system for a Las Vegas hospitality convention.',
    detail:
      'A coordinated convention kit designed as one system: tri-fold brochure, FAQ card and business cards, built to work together on a busy show floor.',
    role: 'Designer & art director',
    disciplines: ['Print', 'Brand'],
    deliverables: ['Tri-fold brochure', 'FAQ card', 'Business cards', 'Print-ready artwork'],
    art: 'print',
    palette: { bg: '#10231c', fg: '#eaf5ee', accent: '#3fd08a' },
  },
  {
    id: 'bookvip',
    title: 'BookVIP.com',
    sector: 'Hospitality & travel',
    summary: 'Web and marketing design for a vacation-package travel brand.',
    detail:
      'Design work across web pages and marketing materials for a hospitality travel brand. Replace this text with the specific scope, pages and campaigns you delivered.',
    role: 'Digital designer',
    disciplines: ['Web', 'Marketing'],
    deliverables: ['Landing pages', 'Campaign graphics', 'Marketing materials'],
    art: 'web',
    palette: { bg: '#2a1408', fg: '#fff3e6', accent: '#ff9d3c' },
  },
  {
    id: 'marcoting',
    title: 'MarcoTing Systems',
    sector: 'Consulting',
    summary: 'A rebrand with a logo system and an editorial-brutalist landing page direction.',
    detail:
      'Branding and website redesign covering a logo system, a book cover mockup and a landing page concept in an editorial brutalist direction.',
    role: 'Brand & web designer',
    disciplines: ['Brand', 'Web'],
    deliverables: ['Logo system', 'Landing page design', 'Book cover mockup'],
    art: 'brand',
    palette: { bg: '#e9e4d9', fg: '#0d0c0a', accent: '#e23d1b' },
  },
  {
    id: 'tarumak',
    title: 'Tarumak Studio',
    sector: 'Own product',
    summary: 'A browser-based platform of free tools, designed and built end to end.',
    detail:
      'A self-initiated product: a platform of free tools that run entirely in the browser. Product strategy, interface design and front-end build by one person.',
    role: 'Founder, designer & developer',
    disciplines: ['Product', 'Web'],
    deliverables: ['Product design', 'Design system', 'Front-end build'],
    art: 'product',
    palette: { bg: '#0f1f24', fg: '#e6fbff', accent: '#39d5e8' },
  },
  {
    id: 'sample-finance',
    title: 'Finance Project',
    sector: 'Finance',
    summary: 'Sample entry: identity and investor site for a boutique advisory firm.',
    detail:
      'Placeholder project. Replace with a finance-sector engagement: the brief, your role and what was delivered.',
    role: 'Creative director',
    disciplines: ['Brand', 'Web'],
    deliverables: ['Identity system', 'Investor website', 'Report templates'],
    art: 'finance',
    palette: { bg: '#1c1730', fg: '#f1edff', accent: '#c9a7ff' },
    placeholder: true,
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: 'cs-marketing-boost',
    projectId: 'marketing-boost',
    kicker: 'Template system',
    title: 'Turning a graphics library into a motion library',
    challenge:
      'Members across very different niches needed promotional assets they could personalise quickly, and static banners were no longer enough.',
    approach:
      'I organised the library by funnel and niche, tightened the review loop for errors, and rebuilt key templates as short animated promos that stay fully editable.',
    outcome:
      'One coherent library that members can use for both static and video promotion, with a clear structure for adding new niches.',
    facts: [
      { value: '4', label: 'Funnels in the library' },
      { value: '4', label: 'Niche template sets' },
      { value: '2', label: 'Formats: static & motion' },
    ],
  },
  {
    id: 'cs-trustbyreviews',
    projectId: 'trustbyreviews',
    kicker: 'Convention collateral',
    title: 'A print kit designed to work a show floor',
    challenge:
      'A hospitality convention gives a brand seconds per visitor. Every printed piece had to explain the product on its own and still feel like part of one set.',
    approach:
      'I designed the brochure, FAQ card and business cards together from one grid, type scale and colour logic, each piece answering a different visitor question.',
    outcome:
      'A consistent, print-ready kit the team could hand out with confidence, where each piece leads naturally to the next.',
    facts: [
      { value: '3', label: 'Coordinated print pieces' },
      { value: '1', label: 'Shared grid & type system' },
      { value: 'LV', label: 'Las Vegas hospitality convention' },
    ],
  },
  {
    id: 'cs-tarumak',
    projectId: 'tarumak',
    kicker: 'Product design & build',
    title: 'Designing and shipping a tools platform solo',
    challenge:
      'Useful everyday tools are often buried behind sign-ups and installs. The goal was a platform that simply opens and works.',
    approach:
      'I set conventions first: shared tokens, a common tool layout and single-file tools that run in the browser, then designed and built each tool against them.',
    outcome:
      'A growing platform where every new tool inherits the same look, behaviour and performance without extra design work.',
    facts: [
      { value: '100%', label: 'Runs in the browser' },
      { value: '1', label: 'Designer and developer' },
      { value: '∞', label: 'Free to use' },
    ],
  },
];

export const processSteps: ProcessStep[] = [
  {
    id: 'discover',
    title: 'Discover',
    summary: 'I start with the business: audience, offer, competitors and what success looks like.',
    outputs: ['Kick-off workshop', 'Audit & benchmarks', 'Project brief'],
  },
  {
    id: 'define',
    title: 'Define',
    summary: 'We agree the idea before the pixels: positioning, structure and creative direction.',
    outputs: ['Creative direction', 'Site map & flows', 'Moodboards'],
  },
  {
    id: 'design',
    title: 'Design',
    summary: 'The direction becomes real, on real content, in the formats it will actually live in.',
    outputs: ['Identity & UI design', 'Prototypes', 'Motion tests'],
  },
  {
    id: 'refine',
    title: 'Refine',
    summary: 'Structured review rounds, with every change checked against the original goals.',
    outputs: ['Feedback rounds', 'Detail & polish', 'Accessibility checks'],
  },
  {
    id: 'deliver',
    title: 'Deliver',
    summary: 'Clean files, clear documentation and support through launch and beyond.',
    outputs: ['Production files', 'Guidelines', 'Launch support'],
  },
];

// TODO: adjust to your actual toolkit.
export const toolGroups: ToolGroup[] = [
  { id: 'design', title: 'Design', note: 'Identity, UI and layout', tools: ['Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign'] },
  { id: 'motion', title: 'Motion & content', note: 'Promo video and templates', tools: ['Canva', 'After Effects', 'Premiere Pro'] },
  { id: 'build', title: 'Build', note: 'Prototypes and production', tools: ['HTML', 'CSS', 'JavaScript', 'React'] },
  { id: 'workflow', title: 'Workflow', note: 'Planning and collaboration', tools: ['Claude', 'Notion', 'Slack', 'Google Workspace'] },
];

// TODO: sample quotes. Replace with real client testimonials before going live.
export const testimonials: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Sudhir understands what the business needs before the design starts. The work arrives considered, on time and ready to use.',
    author: 'Client name',
    role: 'Founder, hospitality brand',
    placeholder: true,
  },
  {
    id: 't2',
    quote:
      'He has been a dependable creative partner for years. Our materials finally look and feel like one brand.',
    author: 'Client name',
    role: 'Marketing director, marketing platform',
    placeholder: true,
  },
  {
    id: 't3',
    quote:
      'Clear communication across time zones and real attention to detail. I would recommend him without hesitation.',
    author: 'Client name',
    role: 'CEO, finance company',
    placeholder: true,
  },
];

export const contact = {
  heading: ['Have a project', 'in mind?'],
  intro:
    'Tell me a little about what you are building. I reply to every enquiry, usually within two working days.',
  projectTypes: ['Brand identity', 'Website / UI design', 'Campaign & marketing', 'Motion & promo video', 'Something else'],
};

// TODO: replace with your profile URLs.
export const socials: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Behance', href: 'https://www.behance.net/' },
  { label: 'Upwork', href: 'https://www.upwork.com/' },
  { label: 'Tarumak Studio', href: 'https://tarumakstudio.com/' },
];
