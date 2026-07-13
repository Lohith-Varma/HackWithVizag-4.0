import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import ProblemStatements from './components/ProblemStatements/ProblemStatements';
import Timeline from './components/Timeline/Timeline';
import Eligibility from './components/Eligibility/Eligibility';
import Rules from './components/Rules/Rules';
import Judging from './components/Judging/Judging';
import Rewards from './components/Rewards/Rewards';
import Speakers from './components/Speakers/Speakers';
import Sponsors from './components/Sponsors/Sponsors';
import FAQ from './components/FAQ/FAQ';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      {/* Premium Glass Sticky Navbar */}
      <Navbar />

      {/* Hero landing with interactive live countdown */}
      <Hero />

      {/* Main sections layout */}
      <main>
        {/* About introducing vision & organizers + stats counters */}
        <About />

        {/* Challenge tracks / Problem Statements cards */}
        <ProblemStatements />

        {/* Vertical glow scroll-connected roadmap timeline */}
        <Timeline />

        {/* Modern eligibility cards */}
        <Eligibility />

        {/* Rules accordion drawers */}
        <Rules />

        {/* Evaluation criteria circular SVG progress graphs */}
        <Judging />

        {/* Perks showcase & cash prize details */}
        <Rewards />

        {/* 3D tilt speaker/mentor directory cards */}
        <Speakers />

        {/* Grayscale hover logo cloud */}
        <Sponsors />

        {/* Frequently Asked Questions accordion */}
        <FAQ />

        {/* Contact info, whatsapp, form validation & custom inverted maps */}
        <Contact />
      </main>

      {/* Site map, socials, credits & floating scroll to top */}
      <Footer />
    </div>
  );
}
