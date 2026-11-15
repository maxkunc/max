import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';
import Services from './components/Services.jsx';
import SelectedWork from './components/SelectedWork.jsx';
import Gallery from './components/Gallery.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <div className="page">
      <Hero />
      <Intro />
      <Services />
      <SelectedWork />
      <Gallery />
      <About />
      <Contact />
    </div>
  );
}
