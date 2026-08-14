import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";

import "./superadmin_email_templates.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import { useAuth } from "../contexts/useAuth";
import {
  EmailTemplatesGetAll,
  EmailTemplateGet,
  EmailTemplateUpdate,
  EmailTemplateTest,
} from "../servicies/API_EmailTemplate";

const FRONTEND_URL = (import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, "");

const escaparHtml = (valor) =>
  String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const extraerPlaceholders = (...textos) => {
  const encontrados = new Set();
  for (const texto of textos) {
    const matches = String(texto ?? "").match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
    matches.forEach((m) => encontrados.add(m.replace(/\{\{\s*|\s*\}\}/g, "")));
  }
  return [...encontrados];
};

// Mismo layout que el backend (emailService.layout): el preview local
// refleja exactamente lo que se enviará al guardar.
const construirPreviewHtml = ({ asunto, header_html, cuerpo_html, footer_html }, mapa) => {
  const reemplazar = (texto) =>
    String(texto ?? "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, nombre) =>
      Object.prototype.hasOwnProperty.call(mapa, nombre) ? escaparHtml(mapa[nombre]) : match
    );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(asunto || "SmartLot")}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 620px) { .contenedor { padding: 12px 8px !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F5F7FB;">
  <div class="contenedor" style="max-width:600px;margin:0 auto;padding:24px 16px;background-color:#F5F7FB;">
    <div style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 30px rgba(12,30,63,0.10);">
      ${reemplazar(header_html)}
      ${reemplazar(cuerpo_html)}
      ${reemplazar(footer_html)}
    </div>
  </div>
</body>
</html>`;
};

const SECCIONES = [
  { clave: "cuerpo_html", etiqueta: "Cuerpo" },
];

const GLOBAL_BODY_EJEMPLO = `
<div style="padding:32px;color:#0f1a2e;font-family:Arial,sans-serif;">
  <h2 style="margin:0 0 12px;">Ejemplo de cuerpo</h2>
  <p>Este bloque se mantiene igual en todos los correos. Reemplazá las variables según la plantilla.</p>
</div>`;

export default function SuperadminEmailTemplates() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [plantillas, setPlantillas] = useState([]);
  const [plantilla, setPlantilla] = useState(null);
  const [variables, setVariables] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [destinatario, setDestinatario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [seccion, setSeccion] = useState("plantillas");
  const [globalHeader, setGlobalHeader] = useState("");
  const [globalFooter, setGlobalFooter] = useState("");

  const cargarPlantilla = async (codigo, mounted = true) => {
    const res = await EmailTemplateGet(codigo);
    if (!mounted) return;
    if (!res.respuesta) {
      setErrorCarga(res.datos?.message || `No se pudo cargar la plantilla "${codigo}".`);
      return;
    }
    const datos = res.datos;
    setPlantilla({
      codigo: datos.codigo,
      nombre: datos.nombre || "",
      descripcion: datos.descripcion || "",
      asunto: datos.asunto || "",
      header_html: datos.header_html || "",
      cuerpo_html: datos.cuerpo_html || "",
      footer_html: datos.footer_html || "",
      activa: datos.activa ?? true,
    });
    setVariables(Array.isArray(datos.variables) ? datos.variables.map((v) => ({ ...v })) : []);
    setOverrides({});
    setMensaje(null);
    return datos;
  };

  useEffect(() => {
    let mounted = true;

    const cargarLista = async () => {
      setCargando(true);
      const res = await EmailTemplatesGetAll();
      if (!mounted) return;
      if (!res.respuesta) {
        setErrorCarga(res.datos?.message || "No se pudieron cargar las plantillas.");
        setCargando(false);
        return;
      }
      const lista = Array.isArray(res.datos) ? res.datos : [];
      setPlantillas(lista);
      if (lista.length > 0) {
        const primera = await cargarPlantilla(lista[0].codigo, mounted);
        if (primera) {
          setGlobalHeader(primera.header_html || "");
          setGlobalFooter(primera.footer_html || "");
        }
      }
      setCargando(false);
    };

    cargarLista();
    return () => { mounted = false; };
  }, []);

  const cambiarPlantilla = async (codigo) => {
    if (codigo === plantilla?.codigo) return;
    setErrorCarga("");
    await cargarPlantilla(codigo);
  };

  const irAlGlobal = () => {
    if (plantilla) {
      setGlobalHeader(plantilla.header_html);
      setGlobalFooter(plantilla.footer_html);
    }
    setSeccion("global");
  };

  const actualizarCampo = (clave, valor) => {
    setPlantilla((prev) => (prev ? { ...prev, [clave]: valor } : prev));
  };

  const placeholders = useMemo(
    () => extraerPlaceholders(plantilla?.asunto, plantilla?.header_html, plantilla?.cuerpo_html, plantilla?.footer_html),
    [plantilla?.asunto, plantilla?.header_html, plantilla?.cuerpo_html, plantilla?.footer_html]
  );

  const mapaPreview = useMemo(() => {
    const mapa = {
      link_login: `${FRONTEND_URL}/login`,
      anio: String(new Date().getFullYear()),
    };
    variables.forEach((v) => {
      if (v?.variable) mapa[v.variable] = v.ejemplo ?? "";
    });
    return { ...mapa, ...overrides };
  }, [variables, overrides]);

  const previewHtml = useMemo(
    () => (plantilla ? construirPreviewHtml(plantilla, mapaPreview) : ""),
    [plantilla, mapaPreview]
  );

  const previewGlobalHtml = useMemo(
    () =>
      construirPreviewHtml(
        { asunto: "Vista previa del header y footer", header_html: globalHeader, cuerpo_html: GLOBAL_BODY_EJEMPLO, footer_html: globalFooter },
        mapaPreview
      ),
    [globalHeader, globalFooter, mapaPreview]
  );

  const variablesFaltantes = placeholders.filter((p) => !Object.prototype.hasOwnProperty.call(mapaPreview, p));

  const abrirPreviewNuevaPestana = (html) => {
    const contenido = html || previewHtml;
    if (!contenido) return;
    const blob = new Blob([contenido], { type: "text/html;charset=utf-8" });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const guardar = async () => {
    if (!plantilla) return;
    setGuardando(true);
    setMensaje(null);
    const res = await EmailTemplateUpdate(plantilla.codigo, {
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      asunto: plantilla.asunto,
      header_html: plantilla.header_html,
      cuerpo_html: plantilla.cuerpo_html,
      footer_html: plantilla.footer_html,
      variables,
      activa: plantilla.activa,
    });
    setGuardando(false);
    if (res.respuesta) {
      const datos = res.datos;
      setPlantilla((prev) => ({
        ...prev,
        nombre: datos.nombre || "",
        descripcion: datos.descripcion || "",
        asunto: datos.asunto || "",
        header_html: datos.header_html || "",
        cuerpo_html: datos.cuerpo_html || "",
        footer_html: datos.footer_html || "",
        activa: datos.activa ?? true,
      }));
      setVariables(Array.isArray(datos.variables) ? datos.variables.map((v) => ({ ...v })) : []);
      setMensaje({ tipo: "ok", texto: `Plantilla "${plantilla.codigo}" guardada correctamente.` });
    } else {
      setMensaje({ tipo: "error", texto: res.datos?.message || "No se pudo guardar la plantilla." });
    }
  };

  const guardarGlobal = async () => {
    if (plantillas.length === 0) return;
    setGuardando(true);
    setMensaje(null);
    let ok = 0;
    let errores = 0;
    for (const t of plantillas) {
      const completo = await EmailTemplateGet(t.codigo);
      if (!completo.respuesta) {
        errores += 1;
        continue;
      }
      const d = completo.datos;
      const res = await EmailTemplateUpdate(t.codigo, {
        nombre: d.nombre || "",
        descripcion: d.descripcion || "",
        asunto: d.asunto || "",
        header_html: globalHeader,
        cuerpo_html: d.cuerpo_html || "",
        footer_html: globalFooter,
        variables: Array.isArray(d.variables) ? d.variables : [],
        activa: d.activa ?? true,
      });
      if (res.respuesta) {
        ok += 1;
      } else {
        errores += 1;
      }
    }
    setGuardando(false);
    setPlantilla((prev) => (prev ? { ...prev, header_html: globalHeader, footer_html: globalFooter } : prev));
    if (errores === 0) {
      setMensaje({ tipo: "ok", texto: `Header y footer actualizados en ${ok} plantilla${ok === 1 ? "" : "s"}.` });
    } else {
      setMensaje({ tipo: "error", texto: `Se actualizaron ${ok} plantilla${ok === 1 ? "" : "s"} y fallaron ${errores}.` });
    }
  };

  const enviarPrueba = async () => {
    if (!plantilla) return;
    const to = destinatario || usuario?.email || "";
    if (!to) {
      setMensaje({ tipo: "error", texto: "Ingresá un destinatario para el correo de prueba." });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    const res = await EmailTemplateTest(plantilla.codigo, { destinatario: to, variables: mapaPreview });
    setEnviando(false);
    if (res.respuesta) {
      setMensaje({ tipo: "ok", texto: `Correo de prueba enviado a ${res.datos?.destinatario || to}.` });
    } else {
      setMensaje({ tipo: "error", texto: res.datos?.message || "No se pudo enviar el correo de prueba." });
    }
  };

  const agregarVariable = () => {
    setVariables((prev) => [...prev, { variable: "", ejemplo: "" }]);
  };

  const actualizarVariable = (indice, clave, valor) => {
    setVariables((prev) => prev.map((v, i) => (i === indice ? { ...v, [clave]: valor } : v)));
  };

  const eliminarVariable = (indice) => {
    setVariables((prev) => prev.filter((_, i) => i !== indice));
  };

  return (
    <div className="tpl-page">
      <HeaderSuperadmin />
      <main className="tpl-main">
        <header className="tpl-header">
          <div className="tpl-title-row">
            <button type="button" className="tpl-back" onClick={() => navigate("/superadmin_dashboard")} aria-label="Volver al panel de control">
              <ArrowLeft size={19} />
            </button>
            <div>
              <span className="tpl-eyebrow">Personalización</span>
              <h1>Plantillas de email</h1>
              <p>Editá los correos del sistema, mirá el preview en vivo y enviá pruebas.</p>
            </div>
          </div>
          <button
            type="button"
            className="tpl-action tpl-action--save"
            onClick={seccion === "global" ? guardarGlobal : guardar}
            disabled={guardando || (seccion === "global" ? plantillas.length === 0 : !plantilla)}
          >
            {guardando ? <Loader2 size={17} className="tpl-spin" /> : <Save size={17} />}
            {guardando
              ? "Guardando..."
              : seccion === "global"
                ? "Guardar en todas las plantillas"
                : "Guardar cambios"}
          </button>
        </header>

        {errorCarga ? (
          <p className="tpl-message tpl-message--error" role="alert">{errorCarga}</p>
        ) : null}

        <nav className="tpl-sections" aria-label="Secciones">
          <button
            type="button"
            className={`tpl-sections-btn ${seccion === "plantillas" ? "tpl-sections-btn--active" : ""}`}
            onClick={() => setSeccion("plantillas")}
          >
            Plantillas
          </button>
          <button
            type="button"
            className={`tpl-sections-btn ${seccion === "global" ? "tpl-sections-btn--active" : ""}`}
            onClick={irAlGlobal}
          >
            Header y Footer (global)
          </button>
        </nav>

        {mensaje ? (
          <p className={`tpl-message tpl-message--${mensaje.tipo}`} role="status" aria-live="polite">
            {mensaje.tipo === "ok" ? <CheckCircle2 size={16} /> : null}
            {mensaje.texto}
          </p>
        ) : null}

        {cargando ? (
          <div className="tpl-loading"><Loader2 size={26} className="tpl-spin" /> Cargando plantillas…</div>
        ) : plantillas.length === 0 ? (
          <div className="tpl-empty">
            <Mail size={30} />
            <h3>No hay plantillas disponibles</h3>
            <p>El sistema todavía no tiene plantillas de email configuradas.</p>
          </div>
        ) : seccion === "global" ? (
          <div className="tpl-grid">
            <section className="tpl-editor" aria-labelledby="tpl-global-title">
              <div className="tpl-section-heading">
                <div>
                  <h2 id="tpl-global-title">Header y Footer globales</h2>
                  <p>Se usan en todos los correos del sistema. Guardá para aplicarlos a todas las plantillas.</p>
                </div>
              </div>

              <div className="tpl-field">
                <label htmlFor="tpl-global-header">Header (encabezado de marca)</label>
                <textarea
                  id="tpl-global-header"
                  value={globalHeader}
                  onChange={(e) => setGlobalHeader(e.target.value)}
                  rows={6}
                  spellCheck="false"
                />
              </div>

              <div className="tpl-field">
                <label htmlFor="tpl-global-footer">Footer (pie de marca)</label>
                <textarea
                  id="tpl-global-footer"
                  value={globalFooter}
                  onChange={(e) => setGlobalFooter(e.target.value)}
                  rows={6}
                  spellCheck="false"
                />
              </div>
            </section>

            <section className="tpl-preview" aria-labelledby="tpl-global-preview-title">
              <div className="tpl-section-heading">
                <div>
                  <h2 id="tpl-global-preview-title">Preview en vivo</h2>
                  <p>Header y footer tal como se verán en cualquier correo.</p>
                </div>
                <button
                  type="button"
                  className="tpl-preview-open"
                  onClick={() => abrirPreviewNuevaPestana(previewGlobalHtml)}
                  title="Abrir preview en pestaña nueva"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
              <div className="tpl-iframe-wrap">
                <iframe title="Preview del header y footer" srcDoc={previewGlobalHtml} sandbox="" />
              </div>
            </section>
          </div>
        ) : (
          <>
            <nav className="tpl-tabs" aria-label="Plantillas disponibles">
              {plantillas.map((t) => (
                <button
                  type="button"
                  key={t.codigo}
                  className={`tpl-tab ${t.codigo === plantilla?.codigo ? "tpl-tab--active" : ""}`}
                  onClick={() => cambiarPlantilla(t.codigo)}
                >
                  {t.nombre}
                  {t.activa === false ? <span className="tpl-tab-badge">inactiva</span> : null}
                </button>
              ))}
            </nav>

            {plantilla ? (
              <div className="tpl-grid">
                <section className="tpl-editor" aria-labelledby="tpl-editor-title">
                  <div className="tpl-section-heading">
                    <div>
                      <h2 id="tpl-editor-title">Editor</h2>
                      <p>Las variables se escriben como {"{{nombre}}"} y se reemplazan al enviar.</p>
                    </div>
                    <label className="tpl-switch">
                      <input
                        type="checkbox"
                        checked={plantilla.activa}
                        onChange={(e) => actualizarCampo("activa", e.target.checked)}
                      />
                      <span>Activa</span>
                    </label>
                  </div>

                  <p className="tpl-global-hint">
                    El <strong>header</strong> y el <strong>footer</strong> son globales: se editan en la sección
                    “Header y Footer (global)” y aplican a todos los correos.
                  </p>

                  <div className="tpl-field tpl-field--half">
                    <label htmlFor="tpl-nombre">Nombre</label>
                    <input
                      id="tpl-nombre"
                      type="text"
                      value={plantilla.nombre}
                      onChange={(e) => actualizarCampo("nombre", e.target.value)}
                      placeholder="Bienvenida"
                    />
                  </div>

                  <div className="tpl-field">
                    <label htmlFor="tpl-asunto">Asunto del correo</label>
                    <input
                      id="tpl-asunto"
                      type="text"
                      value={plantilla.asunto}
                      onChange={(e) => actualizarCampo("asunto", e.target.value)}
                      placeholder="Bienvenido a SmartLot"
                    />
                  </div>

                  {SECCIONES.map(({ clave, etiqueta }) => (
                    <div className="tpl-field" key={clave}>
                      <label htmlFor={`tpl-${clave}`}>{etiqueta}</label>
                      <textarea
                        id={`tpl-${clave}`}
                        value={plantilla[clave]}
                        onChange={(e) => actualizarCampo(clave, e.target.value)}
                        rows={clave === "cuerpo_html" ? 12 : 6}
                        spellCheck="false"
                      />
                    </div>
                  ))}

                  <div className="tpl-field">
                    <div className="tpl-var-head">
                      <label htmlFor="tpl-vars">Variables de ejemplo (para el preview)</label>
                      <button type="button" className="tpl-var-add" onClick={agregarVariable}>
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                    {variables.length === 0 ? (
                      <p className="tpl-var-empty">Sin variables declaradas. Agregá una para darle datos de ejemplo al preview.</p>
                    ) : (
                      <div className="tpl-var-list" id="tpl-vars">
                        {variables.map((v, i) => (
                          <div className="tpl-var-row" key={i}>
                            <input
                              type="text"
                              value={v.variable}
                              onChange={(e) => actualizarVariable(i, "variable", e.target.value)}
                              placeholder="variable"
                              aria-label="Nombre de la variable"
                            />
                            <input
                              type="text"
                              value={v.ejemplo}
                              onChange={(e) => actualizarVariable(i, "ejemplo", e.target.value)}
                              placeholder="Ejemplo: Juan Pérez"
                              aria-label="Ejemplo para el preview"
                            />
                            <button type="button" className="tpl-var-del" onClick={() => eliminarVariable(i)} aria-label="Eliminar variable">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {placeholders.length > 0 ? (
                    <div className="tpl-placeholders">
                      <span className="tpl-placeholders-label"><Braces size={14} /> Placeholders detectados:</span>
                      {placeholders.map((p) => (
                        <span key={p} className={`tpl-chip ${variablesFaltantes.includes(p) ? "tpl-chip--missing" : ""}`}>
                          {"{{"}{p}{"}}"}
                        </span>
                      ))}
                      {variablesFaltantes.length > 0 ? (
                        <p className="tpl-placeholders-hint">Los chips marcados no tienen dato de ejemplo: se mostrarán sin reemplazar en el preview.</p>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <section className="tpl-preview" aria-labelledby="tpl-preview-title">
                  <div className="tpl-section-heading">
                    <div>
                      <h2 id="tpl-preview-title">Preview en vivo</h2>
                      <p>Asunto: {plantilla.asunto || "(sin asunto)"}</p>
                    </div>
                    <button type="button" className="tpl-preview-open" onClick={abrirPreviewNuevaPestana} title="Abrir preview en pestaña nueva">
                      <ExternalLink size={16} />
                    </button>
                  </div>

                  {placeholders.length > 0 ? (
                    <div className="tpl-overrides">
                      {placeholders.map((p) => (
                        <div className="tpl-override" key={p}>
                          <span>{"{{"}{p}{"}}"}</span>
                          <input
                            type="text"
                            value={mapaPreview[p] ?? ""}
                            onChange={(e) => setOverrides((prev) => ({ ...prev, [p]: e.target.value }))}
                            placeholder="Valor para el preview"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="tpl-iframe-wrap">
                    <iframe title="Preview del email" srcDoc={previewHtml} sandbox="" />
                  </div>

                  <div className="tpl-test">
                    <input
                      type="email"
                      value={destinatario}
                      onChange={(e) => setDestinatario(e.target.value)}
                      placeholder="destinatario@ejemplo.com"
                      aria-label="Destinatario del correo de prueba"
                    />
                    <button type="button" className="tpl-action tpl-action--test" onClick={enviarPrueba} disabled={enviando || !plantilla}>
                      {enviando ? <Loader2 size={16} className="tpl-spin" /> : <Send size={16} />}
                      {enviando ? "Enviando..." : "Enviar prueba"}
                    </button>
                  </div>
                  <p className="tpl-test-hint">El correo de prueba se renderiza con los valores del preview actual.</p>
                </section>
              </div>
            ) : null}
          </>
        )}
      </main>
      <FooterSuperadmin />
    </div>
  );
}