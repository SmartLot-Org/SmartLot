import { Link } from "react-router-dom";
import { ArrowLeft, Warehouse } from "lucide-react";
import Navbar from "../componentesLanding/landing/Navbar";
import InteractiveBackground from "../componentesLanding/landing/InteractiveBackground";
import "../componentesLanding/landing/landing.css";

export default function ParaGarages() {
  return (
    <>
      <InteractiveBackground count={70} interactionRadius={150} repelForce={80} />
      <div className="landing-page bg-noise min-h-screen overflow-x-hidden">
        <Navbar />
        <main
          id="main-content"
          className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center"
        >
          <Warehouse size={40} className="mb-6 text-brand-blue" aria-hidden="true" />
          <h1 className="mb-4 text-brand-warm">Para dueños de garages</h1>
          <p className="mb-10 text-brand-muted">Vista en construcción</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al inicio
          </Link>
        </main>
      </div>
    </>
  );
}
