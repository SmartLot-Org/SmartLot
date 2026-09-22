// src/utils/exportarReporteExcel.js

const HEADER_TEXT = "FFFFFFFF";
const MIN_COLUMN_WIDTH = 12;

const aplicarEstiloTitulo = (celda) => {
  celda.font = {
    bold: true,
    size: 17,
    color: { argb: "FFFFFFFF" },
  };

  celda.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };

  celda.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
};

const aplicarEstiloHeader = (fila) => {
  fila.height = 24;

  fila.eachCell((celda) => {
    celda.font = {
      bold: true,
      size: 11,
      color: { argb: HEADER_TEXT },
    };

    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };

    celda.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    celda.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
};

const aplicarBordes = (worksheet) => {
  worksheet.eachRow((fila) => {
    fila.height = Math.max(fila.height || 0, 21);

    fila.eachCell((celda) => {
      celda.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      celda.alignment = {
        ...(celda.alignment || {}),
        vertical: "middle",
      };
    });
  });
};

const aplicarFilasAlternadas = (worksheet, desdeFila) => {
  for (let rowNumber = desdeFila; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    if ((rowNumber - desdeFila) % 2 !== 0) continue;

    worksheet.getRow(rowNumber).eachCell((celda) => {
      celda.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    });
  }
};

const ajustarColumnas = (worksheet) => {
  worksheet.columns.forEach((columna) => {
    let maxLength = MIN_COLUMN_WIDTH;

    columna.eachCell({ includeEmpty: true }, (celda) => {
      const valor = celda.value ? celda.value.toString() : "";
      maxLength = Math.max(maxLength, valor.length);
    });

    columna.width = Math.min(maxLength + 4, 40);
  });
};

const obtenerFechaActual = () => {
  return new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const insertarGraficoTendencia = (workbook, worksheet, graficoTendencia, startRow) => {
  const tituloRow = startRow;
  const tituloCell = worksheet.getCell(tituloRow, 1);

  worksheet.mergeCells(tituloRow, 1, tituloRow, 2);
  tituloCell.value = "Gráfico de tendencia de ocupación";
  tituloCell.font = {
    bold: true,
    size: 12,
    color: { argb: HEADER_TEXT },
  };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };
  tituloCell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  tituloCell.border = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  worksheet.getRow(tituloRow).height = 28;

  const imagenId = workbook.addImage({
    base64: graficoTendencia,
    extension: "png",
  });

  worksheet.addImage(imagenId, {
    tl: { col: 0, row: tituloRow },
    ext: { width: 560, height: 240 },
  });

  // Set row heights for chart area
  for (let fila = tituloRow + 1; fila <= tituloRow + 14; fila++) {
    worksheet.getRow(fila).height = 17;
  }
};

export const exportarReporteExcel = async (datosReporte, opciones = {}) => {
  const [{ default: ExcelJS }] = await Promise.all([import("exceljs")]);
  const workbook = new ExcelJS.Workbook();
  const { graficoTendencia } = opciones;
  const granularidadLabel = datosReporte.granularidadLabel ?? "Periodo";
  const etiquetaDimension = datosReporte.etiquetaDimension ?? "Periodo";
  const periodo = datosReporte.periodo ?? "-";

  workbook.creator = "Sistema de Reportes";
  workbook.created = new Date();

  // =========================
  // HOJA 1: RESUMEN
  // =========================

  const hojaResumen = workbook.addWorksheet("Resumen");
  hojaResumen.properties.tabColor = { argb: "FF2563EB" };
  hojaResumen.views = [{ state: "frozen", ySplit: 4 }];

  hojaResumen.mergeCells("A1:J1");
  hojaResumen.getCell("A1").value = "Reporte de datos - SmartLot";
  aplicarEstiloTitulo(hojaResumen.getCell("A1"));
  hojaResumen.getRow(1).height = 28;

  // Date
  hojaResumen.getCell("A2").value = `Generado el: ${obtenerFechaActual()}`;
  hojaResumen.getCell("A2").font = { italic: true, color: { argb: "FF475569" } };
  hojaResumen.getCell("A2").alignment = { vertical: "middle" };

  // Spacer
  hojaResumen.addRow([]);

  // KPI Header
  const headerResumen = hojaResumen.addRow(["Indicador", "Valor"]);
  aplicarEstiloHeader(headerResumen);
  hojaResumen.getRow(4).height = 28;

  hojaResumen.addRow(["Ocupación media", `${datosReporte.ocupacionMedia}%`]);
  hojaResumen.addRow(["Usuarios activos", datosReporte.usuariosActivos]);
  hojaResumen.addRow(["Tiempo promedio", datosReporte.tiempoPromedio]);
  hojaResumen.addRow(["Horas pico", datosReporte.horasPico]);
  hojaResumen.addRow(["Periodo", periodo]);
  hojaResumen.addRow(["Vista", granularidadLabel]);
  hojaResumen.addRow(["Reservas totales", datosReporte.reservasTotales ?? "-"]);

  hojaResumen.autoFilter = {
    from: "A4",
    to: "B4",
  };

  aplicarFilasAlternadas(hojaResumen, 5);
  aplicarBordes(hojaResumen);
  ajustarColumnas(hojaResumen);

  hojaResumen.getColumn(2).alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Chart: placed below the KPI table with a spacer row
  if (graficoTendencia) {
    const chartStartRow = hojaResumen.rowCount + 2;
    insertarGraficoTendencia(workbook, hojaResumen, graficoTendencia, chartStartRow);
  }

  // =========================
  // HOJA 2: TENDENCIA SEMANAL
  // =========================

  const hojaTendencia = workbook.addWorksheet(`Tendencia ${granularidadLabel}`);
  hojaTendencia.properties.tabColor = { argb: "FF0F766E" };
  hojaTendencia.views = [{ state: "frozen", ySplit: 4 }];

  hojaTendencia.mergeCells("A1:J1");
  hojaTendencia.getCell("A1").value = `Tendencia por ${granularidadLabel.toLowerCase()} - ${periodo}`;
  aplicarEstiloTitulo(hojaTendencia.getCell("A1"));
  hojaTendencia.getRow(1).height = 28;

  // Date
  hojaTendencia.getCell("A2").value = `Generado el: ${obtenerFechaActual()}`;
  hojaTendencia.getCell("A2").font = { italic: true, color: { argb: "FF475569" } };
  hojaTendencia.getCell("A2").alignment = { vertical: "middle" };

  // Spacer
  hojaTendencia.addRow([]);

  const headerTendencia = hojaTendencia.addRow([etiquetaDimension, "Reservas", "Ocupación (%)"]);
  aplicarEstiloHeader(headerTendencia);
  hojaTendencia.getRow(4).height = 28;

  datosReporte.tendencia.forEach((item) => {
    hojaTendencia.addRow([item.dia, item.count ?? 0, item.valor]);
  });

  hojaTendencia.autoFilter = {
    from: "A4",
    to: "C4",
  };

  aplicarFilasAlternadas(hojaTendencia, 5);
  aplicarBordes(hojaTendencia);
  ajustarColumnas(hojaTendencia);

  hojaTendencia.getColumn(3).numFmt = '0"%"';
  hojaTendencia.getColumn(2).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  hojaTendencia.getColumn(3).alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Chart: placed below the table data
  if (graficoTendencia) {
    const chartStartRow = 5 + datosReporte.tendencia.length + 2; // data rows + spacer
    insertarGraficoTendencia(workbook, hojaTendencia, graficoTendencia, chartStartRow);
  }

  // =========================
  // DESCARGA DEL ARCHIVO
  // =========================

  const fechaArchivo = new Date().toISOString().split("T")[0];
  const nombreArchivo = `reporte_datos_${fechaArchivo}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const { saveAs } = await import("file-saver");
  saveAs(blob, nombreArchivo);
};
