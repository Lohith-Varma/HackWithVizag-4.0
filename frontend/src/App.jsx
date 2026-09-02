import { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import ProblemStatements from './components/ProblemStatements/ProblemStatements';
import Timeline from './components/Timeline/Timeline';
import Eligibility from './components/Eligibility/Eligibility';
import Rules from './components/Rules/Rules';
import Judging from './components/Judging/Judging';
import Rewards from './components/Rewards/Rewards';
// import Sponsors from './components/Sponsors/Sponsors';
import FAQ from './components/FAQ/FAQ';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import Auth from './pages/Auth';
import AdminPortal from './pages/AdminPortal';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import { loadCurrentUser } from './utils/registrationStorage';
import './App.css';

const routes = {
  '#auth': 'auth',
  '#dashboard': 'dashboard',
  '#registration': 'registration',
  '#register': 'registration',
  '#register-soon': 'registration',
  '#registration-soon': 'registration',
  '#coming-soon': 'registration',
  '#admin': 'admin',
};

function getCurrentRoute() {
  const hash = window.location.hash.toLowerCase();
  if (hash.startsWith('#admin')) return 'admin';
  if (
    hash.startsWith('#registration-soon') ||
    hash.startsWith('#register-soon') ||
    hash.startsWith('#coming-soon') ||
    hash.startsWith('#register') ||
    hash.startsWith('#registration')
  ) {
    return 'registration';
  }
  if (hash.startsWith('#dashboard')) return 'dashboard';
  if (hash.startsWith('#auth') || hash.startsWith('#login')) return 'auth';

  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/admin')) return 'admin';
  if (
    path.startsWith('/registration-soon') ||
    path.startsWith('/register-soon') ||
    path.startsWith('/coming-soon') ||
    path.startsWith('/register') ||
    path.startsWith('/registration')
  ) {
    return 'registration';
  }
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/auth') || path.startsWith('/login')) return 'auth';

  return routes[window.location.hash] || 'landing';
}


export default function App() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getCurrentRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (route !== 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const hash = window.location.hash || '#home';
    const id = hash.substring(1);
    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
      }
    }, 0);
  }, [route]);

  const currentUser = loadCurrentUser();

  const renderPage = () => {
    if (route === 'admin') return <AdminPortal />;
    if (route === 'auth') return <Auth />;
    if (route === 'dashboard') {
      if (!currentUser) return <Auth />;
      return <Dashboard />;
    }
    if (route === 'registration') {
      if (!currentUser) return <Auth />;
      return <Registration />;
    }

    return (
      <>
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

          {/* Grayscale hover logo cloud */}
          {/* <Sponsors />   */}

          {/* Frequently Asked Questions accordion */}
          <FAQ />

          {/* Contact info, whatsapp, form validation & custom inverted maps */}
          <Contact />
        </main>

        {/* Site map, socials, credits & floating scroll to top */}
        <Footer />
      </>
    );
  };

  return (
    <div className="app-container">
      {/* Premium Glass Sticky Navbar */}
      {route !== 'admin' && <Navbar />}
      {renderPage()}
    </div>
  );
}
