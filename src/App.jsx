import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';
import Services from './components/Services.jsx';
import SelectedWork from './components/SelectedWork.jsx';
import Gallery from './components/Gallery.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import { isPreview } from './content/index.js';

export default function App({ content: c }) {
  return (
    <div className="page">
      {isPreview && (
        <div className="preview-bar">
          Preview of unsaved admin changes · <a href="./">View published site</a>
        </div>
      )}
      <Hero hero={c.hero} siteName={c.footer.name} />
      <Intro intro={c.intro} />
      <Services services={c.services} />
      <SelectedWork work={c.work} />
      <Gallery gallery={c.gallery} />
      <About about={c.about} />
      <Contact contact={c.contact} footer={c.footer} />
    </div>
  );
}
