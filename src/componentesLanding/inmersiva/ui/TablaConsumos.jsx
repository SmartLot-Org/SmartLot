import { DEMO } from '../contenido/secciones';

// El detalle de consumos como lo muestra el producto: tiempo, tarifa e importe
// por reserva. Los valores son de demostración y la tabla lo dice.
export function TablaConsumos() {
  const { titulo, columnas, filas, total, exportar } = DEMO.consumos;
  return (
    <div className="plano-planilla">
      <table>
        <caption>
          {titulo} <small>{DEMO.aviso}</small>
        </caption>
        <thead>
          <tr>
            {columnas.map((c, i) => <th key={c} scope="col" className={i ? 'num' : undefined}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.reserva}>
              <th scope="row">{f.reserva}</th>
              <td className="num">{f.tiempo}</td>
              <td className="num">{f.tarifa}</td>
              <td className="num">{f.importe}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>{total.etiqueta}</th>
            <td className="num">{total.importe}</td>
          </tr>
        </tfoot>
      </table>
      <p>{exportar}</p>
    </div>
  );
}
