import { useEffect, lazy, Suspense } from "react";
import Navbar from "../componentesLanding/landing/Navbar";
import StatsTicker from "../componentesLanding/landing/StatsTicker";
import InteractiveBackground from "../componentesLanding/landing/InteractiveBackground";
import ParaGaragesHero from "../componentesLanding/paraGarages/ParaGaragesHero";
import GarageWatermark from "../componentesLanding/paraGarages/GarageWatermark";
import "../componentesLanding/landing/landing.css";

const ParaGaragesPains = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesPains"));
const ParaGaragesSteps = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesSteps"));
const ParaGaragesBento = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesBento"));
const ParaGaragesShowcase = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesShowcase"));
const ParaGaragesReports = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesReports"));
const ParaGaragesSecurity = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesSecurity"));
const ParaGaragesSocial = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesSocial"));
const ParaGaragesCTA = lazy(() => import("../componentesLanding/paraGarages/ParaGaragesCTA"));

const GARAGE_STATS = [
  { label: "meses de historial", value: "24" },
  { label: "tarifas por vehículo", value: "3" },
  { label: "online, sin hardware", value: "100%" },
  { label: "exportación de consumos", value: "PDF+XLS" },
];

function SkeletonFallback() {
  return (
    <div className="flex h-96 w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
    </div>
  );
}

export default function ParaGarages() {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]');
    const prevContent = prevDesc?.getAttribute("content") ?? "";
    const prevLang = document.documentElement.lang;

    document.title = "SmartLot para dueños de garages | Aparecé en el mapa de las empresas";
    document.documentElement.lang = "es-AR";
    if (prevDesc) {
      prevDesc.setAttribute(
        "content",
        "Publicá tus garages, recibí solicitudes de empresas y gestioná tratos, ocupación y consumos desde un solo panel. Sin hardware."
      );
    }

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      if (prevDesc) prevDesc.setAttribute("content", prevContent);
    };
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-warm focus:shadow-lg focus:ring-2 focus:ring-brand-blue"
      >
        Saltar al contenido principal
      </a>
      <InteractiveBackground count={70} interactionRadius={150} repelForce={80} />
      <GarageWatermark />
      <div className="landing-page pg-page bg-noise min-h-screen overflow-x-hidden">
        <Navbar />
        <main id="main-content" className="relative z-10">
          <ParaGaragesHero />
          <StatsTicker stats={GARAGE_STATS} ariaLabel="Datos y capacidades de la plataforma" />
          <Suspense fallback={<SkeletonFallback />}>
            <ParaGaragesPains />
            <ParaGaragesSteps />
            <ParaGaragesBento />
            <ParaGaragesShowcase />
            <ParaGaragesReports />
            <ParaGaragesSecurity />
            <ParaGaragesSocial />
          </Suspense>
        </main>
        <Suspense fallback={<SkeletonFallback />}>
          <ParaGaragesCTA />
        </Suspense>
      </div>
    </>
  );
}
