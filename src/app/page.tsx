"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Language = "en" | "rw" | "fr" | "sw";

type Station = {
  id: string;
  name: string;
  isHub: boolean;
};

const translations = {
  en: {
    title1: "Move Smarter in Kigali.",
    title2: "No Stress. No Guessing.",
    subtitle: "Plan a clear passenger journey across Kigali with simple route guidance.",
    searchPlaceholder: "Where are you waiting? (e.g., Nyabugogo)",
    passengerTitle: "Passenger Route Finder",
    passengerDesc:
      "Choose where you are and where you are going, then view matching routes and active buses in one simple flow.",
    focusTitle: "Passenger MVP",
    focusDesc:
      "This version is focused on the passenger experience first so the core journey is reliable before expanding to drivers and cargo.",
    driverTitle: "Driver Demand Board",
    driverDesc:
      "View active routes, live bus positions, and stops where passenger demand is building right now.",
    cta: "Open Passenger Route Finder",
    driverCta: "Open Driver Board",
  },
  rw: {
    title1: "Gerayo Ku Igihe.",
    title2: "Nta Rujijo. Nta Gukekeranya.",
    subtitle: "Teganya urugendo rwawe i Kigali mu buryo bworoshye kandi bwumvikana.",
    searchPlaceholder: "Wategereje he? (Urug: Nyabugogo)",
    passengerTitle: "Inzira z'Umugenzi",
    passengerDesc:
      "Hitamo aho uri n'aho ujya, ubone imirongo iboneka hamwe n'imodoka zikora muri uwo mwanya.",
    focusTitle: "Passenger MVP",
    focusDesc:
      "Ubu buryo bwibanda ku mugenzi mbere na mbere kugira ngo urugendo rw'ibanze rukore neza mbere yo kongeramo ibindi.",
    driverTitle: "Driver Demand Board",
    driverDesc:
      "Reba routes zikora, aho imodoka zigeze, n'ibyapa biriho demand y'abagenzi muri aka kanya.",
    cta: "Jya Kureba Inzira z'Abagenzi",
    driverCta: "Fungura Driver Board",
  },
  fr: {
    title1: "Deplacez-vous plus intelligemment a Kigali.",
    title2: "Pas de stress. Pas de devinettes.",
    subtitle: "Planifiez un trajet passager clair dans Kigali, simplement.",
    searchPlaceholder: "Ou attendez-vous ? (ex. Nyabugogo)",
    passengerTitle: "Planificateur Passager",
    passengerDesc:
      "Choisissez votre point de depart et votre destination, puis consultez les itineraires correspondants et les bus actifs.",
    focusTitle: "MVP Passager",
    focusDesc:
      "Cette version se concentre d'abord sur l'experience passager afin de rendre le trajet principal fiable avant d'elargir le produit.",
    driverTitle: "Tableau Chauffeur",
    driverDesc:
      "Consultez les routes actives, les positions actuelles des bus et les arrets ou la demande augmente.",
    cta: "Ouvrir le planificateur passager",
    driverCta: "Ouvrir le tableau chauffeur",
  },
  sw: {
    title1: "Safiri kwa Urahisi Kigali.",
    title2: "Hakuna Mkazo. Hakuna Kubahatisha.",
    subtitle: "Panga safari ya abiria Kigali kwa njia iliyo wazi na rahisi.",
    searchPlaceholder: "Unasubiri wapi? (mfano, Nyabugogo)",
    passengerTitle: "Mpangaji wa Abiria",
    passengerDesc:
      "Chagua ulipo na unapoenda, kisha uone njia zinazolingana pamoja na mabasi yanayotumika sasa.",
    focusTitle: "Passenger MVP",
    focusDesc:
      "Toleo hili linaanza na uzoefu wa abiria ili safari kuu iwe thabiti kabla ya kupanua kwa madereva na mizigo.",
    driverTitle: "Dashibodi ya Dereva",
    driverDesc:
      "Ona njia zinazotumika, mabasi yalipo sasa, na vituo ambavyo mahitaji ya abiria yanaongezeka.",
    cta: "Fungua Kipangaji cha Abiria",
    driverCta: "Fungua Dashibodi ya Dereva",
  },
} as const;

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("en");
  const [stations, setStations] = useState<Station[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const t = translations[lang];

  useEffect(() => {
    fetch("/api/stations")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load stations");
        }
        return res.json();
      })
      .then((data) => {
        setStations([...(data.hubs || []), ...(data.stops || [])]);
      })
      .catch((error) => {
        console.error("Failed to load landing stations", error);
      });
  }, []);

  const matchingStation = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return null;
    }

    return (
      stations.find((station) => station.name.toLowerCase() === normalizedSearch) ||
      stations.find((station) => station.name.toLowerCase().includes(normalizedSearch)) ||
      null
    );
  }, [searchValue, stations]);

  const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (matchingStation) {
      router.push(`/passenger?originId=${encodeURIComponent(matchingStation.id)}`);
      return;
    }

    router.push("/passenger");
  };

  return (
    <>
      <div className="image-bg"></div>
      <div className="video-overlay"></div>

      <main className="hero-container">
        <header className="nav-header">
          <div className="brand">
            eTapin<span className="brand-dot"></span>
          </div>

          <div className="language-selector">
            <button
              className={`lang-btn ${lang === "rw" ? "active" : ""}`}
              onClick={() => setLang("rw")}
            >
              Kinyarwanda
            </button>
            <button
              className={`lang-btn ${lang === "sw" ? "active" : ""}`}
              onClick={() => setLang("sw")}
            >
              Kiswahili
            </button>
            <button
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
            >
              English
            </button>
            <button
              className={`lang-btn ${lang === "fr" ? "active" : ""}`}
              onClick={() => setLang("fr")}
            >
              Francais
            </button>
          </div>
        </header>

        <div className="hero-content">
          <h1 className="hero-title">
            {t.title1}
            <br />
            <span className="text-gradient">{t.title2}</span>
          </h1>
          <p className="hero-subtitle">{t.subtitle}</p>

          <form className="hero-search-wrapper" onSubmit={handleHeroSearch}>
            <button
              type="submit"
              className="hero-search-icon"
              aria-label="Open route finder"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <input
              type="text"
              className="hero-search-input"
              placeholder={t.searchPlaceholder}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              list="landing-stations"
            />
            <datalist id="landing-stations">
              {stations.map((station) => (
                <option key={station.id} value={station.name} />
              ))}
            </datalist>
          </form>
        </div>

        <div className="portal-grid portal-grid-single">
          <Link href="/passenger" className="portal-card card-passenger portal-card-primary">
            <div className="portal-icon-wrapper">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className="portal-title">{t.passengerTitle}</h2>
            <p className="portal-desc">{t.passengerDesc}</p>
            <span className="portal-cta">{t.cta}</span>
          </Link>

          <Link href="/driver" className="portal-card card-focus card-driver-board">
            <div className="portal-icon-wrapper">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v18"></path>
                <path d="M3 12h18"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
            </div>
            <h2 className="portal-title">{t.driverTitle}</h2>
            <p className="portal-desc">{t.driverDesc}</p>
            <span className="portal-cta">{t.driverCta}</span>
          </Link>
        </div>

        <footer className="landing-footer">
          <div className="rnp-campaign">
            <span className="rnp-blue">#GERA</span>
            <span className="rnp-yellow">YOAMA</span>
            <span className="rnp-green">HORO</span>
          </div>
        </footer>
      </main>
    </>
  );
}
