import Link from 'next/link';
import DriverDashboard from '@/components/DriverDashboard';
import { getDriverDashboardData } from '@/lib/driverDashboard';

export default async function DriverPortal() {
  const dashboardData = await getDriverDashboardData();

  return (
    <main className="passenger-portal">
      <header className="portal-header glass-panel">
        <div className="header-content">
          <Link href="/" className="back-link">
            &larr; Subira inyuma (Back)
          </Link>
          <h1 className="portal-logo">eTapin <span>Driver</span></h1>
        </div>
      </header>

      <section className="portal-hero">
        <div className="hero-text">
          <h1>Reba Demand Live.</h1>
          <p>Menya aho abagenzi bategereje kugira ngo ukore urugendo rufite icyerekezo.</p>
        </div>

        <DriverDashboard initialData={dashboardData} />
      </section>

      <footer className="portal-footer">
        <div className="campaign-banner">
          <h2>
            <span className="blue-text">#GERA</span>
            <span className="yellow-text">YOA</span>
            <span className="green-text">MAHORO</span>
          </h2>
          <p>Bwira route aho demand iri</p>
        </div>
      </footer>
    </main>
  );
}
