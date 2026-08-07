import "./skeleton_admin_garage.css";

const Linea = ({ width = "100%", height = "12px" }) => (
  <span className="garage-skeleton-block" style={{ "--skeleton-width": width, "--skeleton-height": height }} />
);

export function SkeletonValorMetrica() {
  return <span className="garage-skeleton-value garage-skeleton-block" aria-hidden="true" />;
}

function TarjetaGarageSkeleton() {
  return <article className="garage-card-skeleton" aria-hidden="true">
    <div className="garage-card-skeleton__top"><span className="garage-skeleton-icon garage-skeleton-block"/><Linea width="34%" height="22px"/></div>
    <div className="garage-card-skeleton__body"><Linea width="72%" height="20px"/><Linea width="92%"/><Linea width="58%"/></div>
    <div className="garage-card-skeleton__stats"><Linea height="42px"/><Linea height="42px"/></div>
    <Linea height="9px"/>
  </article>;
}

export function SkeletonGarages({ cantidad = 3 }) {
  return <div className="duenio-garages-grid garage-skeleton-group" role="status" aria-label="Cargando garages">
    {Array.from({ length: cantidad }, (_, index) => <TarjetaGarageSkeleton key={index}/>)}
  </div>;
}

export function SkeletonTratos() {
  return <div className="deal-skeleton" role="status" aria-label="Cargando solicitudes y tratos">
    <div className="deal-skeleton__toolbar"><div><Linea width="28%"/><Linea width="56%" height="25px"/><Linea width="72%"/></div><Linea width="105px" height="42px"/></div>
    <div className="deal-skeleton__summary">{Array.from({ length: 4 }, (_, index) => <div key={index}><span className="garage-skeleton-icon garage-skeleton-block"/><div><Linea width="78%"/><Linea width="38%" height="24px"/></div></div>)}</div>
    <div className="deal-skeleton__panel"><div className="deal-skeleton__heading"><Linea width="220px" height="21px"/><Linea width="90px" height="26px"/></div><div className="deal-skeleton__cards">{Array.from({ length: 3 }, (_, index) => <div key={index}><Linea width="72%" height="18px"/><Linea height="54px"/><Linea width="42%" height="28px"/><Linea width="88%"/><Linea height="40px"/></div>)}</div></div>
    <span className="sr-only">Cargando contenido</span>
  </div>;
}

export function SkeletonFormularioGarage() {
  return <div className="garage-form-skeleton" role="status" aria-label="Cargando datos del garage">
    {Array.from({ length: 3 }, (_, index) => <div key={index}><Linea width="24%"/><Linea height="44px"/></div>)}
    <div className="garage-form-skeleton__prices"><Linea width="38%" height="18px"/><div>{Array.from({ length: 3 }, (_, index) => <div key={index}><Linea width="45%"/><Linea height="44px"/></div>)}</div></div>
    <span className="sr-only">Cargando formulario</span>
  </div>;
}
