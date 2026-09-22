

const obtenerFechaArchivo = () => {
  return new Date().toISOString().split("T")[0];
};

const obtenerFechaLegible = () => {
  return new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const agregarTitulo = (doc, titulo, logoBase64) => {
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 25, "F");

  if (logoBase64) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 4, 34, 17, 2, 2, "F");
    doc.addImage(logoBase64, "PNG", 14, 6, 30, 12);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, logoBase64 ? 118 : 105, 16, { align: "center" });
};

const agregarFooter = (doc) => {
  const cantidadPaginas = doc.internal.getNumberOfPages();

  for (let i = 1; i <= cantidadPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${i} de ${cantidadPaginas}`, 105, 290, {
      align: "center",
    });
  }
};

export const exportarReportePDF = async (reporte = {}, opciones = {}) => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const metricasBase = reporte.metricas ?? reporte;
  const metricas = {
    ...metricasBase,
    ocupacionMedia: metricasBase.ocupacionMedia != null ? `${metricasBase.ocupacionMedia}%` : undefined,
    horaPico: metricasBase.horaPico ?? metricasBase.horasPico,
  };
  const tendenciaBase = reporte.tendenciaSemanal ?? reporte.tendencia ?? [];
  const tendenciaSemanal = tendenciaBase.map((item) => ({
    ...item,
    ocupacion: item.ocupacion ?? (item.valor != null ? `${item.valor}%` : undefined),
  }));
  const etiquetaDimension = reporte.etiquetaDimension ?? metricasBase.etiquetaDimension ?? "Periodo";
  const graficoBase64 = reporte.graficoBase64 ?? opciones.graficoBase64 ?? opciones.graficoTendencia ?? null;
  const logoBase64 = reporte.logoBase64 ?? opciones.logoBase64 ?? null;
  const doc = new jsPDF("p", "mm", "a4");

  agregarTitulo(doc, "Reporte de Datos", logoBase64);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de generación: ${obtenerFechaLegible()}`, 14, 35);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen general", 14, 48);

  autoTable(doc, {
    startY: 53,
    head: [["Métrica", "Valor"]],
    body: [
      ["Ocupación media", metricas.ocupacionMedia ?? "-"],
      ["Usuarios activos", metricas.usuariosActivos ?? "-"],
      ["Tiempo promedio", metricas.tiempoPromedio ?? "-"],
      ["Hora pico", metricas.horaPico ?? "-"],
    ],
    styles: {
      halign: "center",
      valign: "middle",
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let posicionY = doc.lastAutoTable.finalY + 12;

  if (graficoBase64) {
    if (posicionY > 200) {
      doc.addPage();
      posicionY = 25;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Gráfico de tendencia", 14, posicionY);

    doc.addImage(graficoBase64, "PNG", 14, posicionY + 5, 180, 65);

    posicionY += 78;
  }

  if (posicionY > 220) {
    doc.addPage();
    posicionY = 25;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Tendencia semanal", 14, posicionY);

  autoTable(doc, {
    startY: posicionY + 5,
    head: [[etiquetaDimension, "Reservas", "Ocupación"]],
    body: tendenciaSemanal.map((item) => [
      item.dia ?? "-",
      item.count ?? "-",
      item.ocupacion ?? "-",
    ]),
    styles: {
      halign: "center",
      valign: "middle",
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  agregarFooter(doc);

  doc.save(`reporte_datos_${obtenerFechaArchivo()}.pdf`);
};
