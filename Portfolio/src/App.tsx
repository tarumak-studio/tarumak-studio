import { Cursor } from './components/Cursor';
import { Nav } from './components/Nav';
import { useTheme } from './hooks';
import { About } from './sections/About';
import { CaseStudies } from './sections/CaseStudies';
import { Contact, Footer } from './sections/Contact';
import { Hero } from './sections/Hero';
import { Process } from './sections/Process';
import { Projects } from './sections/Projects';
import { Services } from './sections/Services';
import { Testimonials } from './sections/Testimonials';
import { Tools } from './sections/Tools';

export function App() {
  const [theme, toggleTheme] = useTheme();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav theme={theme} onToggleTheme={toggleTheme} />
      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <Services />
        <Projects />
        <CaseStudies />
        <Process />
        <Tools />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
