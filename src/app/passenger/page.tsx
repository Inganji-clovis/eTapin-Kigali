import PassengerForm from '@/components/PassengerForm';
import Link from 'next/link';
import { Suspense } from 'react';

export default function PassengerPortal() {
  return (
    <main className="passenger-portal">
      <header className="portal-header glass-panel">
        <div className="header-content">
          <Link href="/" className="back-link">
            &larr; Subira inyuma (Back)
          </Link>
          <h1 className="portal-logo">eTapin <span>Passenger</span></h1>
        </div>
      </header>

      <section className="portal-hero">
        <div className="hero-text">
          <h1>Murakaza Neza.</h1>
          <p>Urugendo rwiza, rwihuse kandi rworoshye.</p>
        </div>
        
        <Suspense fallback={<div className="glass-panel passenger-form-loading">Birimo gutegura urugendo...</div>}>
          <PassengerForm />
        </Suspense>
      </section>

      <footer className="portal-footer">
        <div className="campaign-banner">
          <h2>
            <span className="blue-text">#GERA</span>
            <span className="yellow-text">YOA</span>
            <span className="green-text">MAHORO</span>
          </h2>
          <p>Bworohereze buri wese</p>
        </div>
      </footer>
    </main>
  );
}
