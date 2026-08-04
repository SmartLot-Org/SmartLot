const fechaArchivo = () => new Date().toISOString().slice(0, 10);
const moneda = '[$$-es-AR] #,##0';

export const exportarCuentasPDF = async (cuentas, resumen) => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, 297, 30, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("SmartLot · Cuentas corrientes", 16, 14);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")}`, 16, 22);
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(`Saldo pendiente: ${resumen.saldoFormateado}`, 16, 42);
  doc.text(`Importe vencido: ${resumen.vencidoFormateado}`, 105, 42);
  doc.text(`Garages con saldo: ${resumen.garages}`, 197, 42);
  autoTable(doc, {
    startY: 50,
    head: [["Garage", "Período", "Consumos", "Importe", "Vencimiento", "Estado"]],
    body: cuentas.map((c) => [c.garage, c.periodo, `${c.consumos} reservas`, c.importeFormateado, c.vencimientoFormateado, c.estado]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 4, textColor: [51, 65, 85] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
    margin: { left: 16, right: 16 },
  });
  const paginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text(`Página ${pagina} de ${paginas}`, 281, 200, { align: "right" });
  }
  doc.save(`cuentas_corrientes_smartlot_${fechaArchivo()}.pdf`);
};

export const exportarCuentasExcel = async (cuentas, resumen) => {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import("exceljs"), import("file-saver")]);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SmartLot";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;
  workbook.calcProperties.calcMode = "auto";

  const sheet = workbook.addWorksheet("Cuentas corrientes", {
    views: [{ state: "frozen", ySplit: 8, showGridLines: false }],
    properties: { tabColor: { argb: "FF2563EB" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const firstDataRow = 9;
  const lastDataRow = firstDataRow + Math.max(cuentas.length - 1, 0);
  const rangoEstado = `F${firstDataRow}:F${lastDataRow}`;
  const rangoImporte = `D${firstDataRow}:D${lastDataRow}`;

  sheet.mergeCells("A1:F1");
  Object.assign(sheet.getCell("A1"), {
    value: "SmartLot · Cuentas corrientes",
    font: { bold: true, size: 18, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } },
    alignment: { vertical: "middle", horizontal: "left", indent: 1 },
  });
  sheet.getRow(1).height = 38;
  sheet.mergeCells("A2:F2");
  sheet.getCell("A2").value = `Generado el ${new Date().toLocaleString("es-AR")} · Los indicadores se actualizan al editar importes o estados`;
  sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  sheet.getCell("A2").alignment = { vertical: "middle", indent: 1 };
  sheet.getRow(2).height = 23;

  const indicators = [
    [1, "TOTAL ADEUDADO", cuentas.length ? `SUMIF(${rangoEstado},"<>Al día",${rangoImporte})` : "0", resumen.saldo, "FF2563EB", true],
    [3, "IMPORTE VENCIDO", cuentas.length ? `SUMIF(${rangoEstado},"Vencido",${rangoImporte})` : "0", resumen.vencido, "FFDC2626", true],
    [5, "GARAGES CON SALDO", cuentas.length ? `COUNTIF(${rangoEstado},"<>Al día")` : "0", resumen.garages, "FF475569", false],
  ];
  indicators.forEach(([column, label, formula, result, color, isCurrency]) => {
    sheet.mergeCells(4, column, 4, column + 1);
    sheet.mergeCells(5, column, 5, column + 1);
    const labelCell = sheet.getCell(4, column);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 9, color: { argb: "FF64748B" } };
    labelCell.alignment = { vertical: "middle", horizontal: "center" };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    const valueCell = sheet.getCell(5, column);
    valueCell.value = { formula, result };
    valueCell.font = { bold: true, size: 16, color: { argb: color } };
    valueCell.alignment = { vertical: "middle", horizontal: "center" };
    valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    valueCell.border = { bottom: { style: "medium", color: { argb: color } } };
    if (isCurrency) valueCell.numFmt = moneda;
  });
  sheet.getRow(4).height = 20; sheet.getRow(5).height = 31;

  sheet.mergeCells("A7:F7");
  const helper = sheet.getCell("A7");
  helper.value = "TIP: Editá un importe o elegí otro estado; los totales superiores se recalcularán automáticamente.";
  helper.font = { size: 10, color: { argb: "FF1E40AF" } };
  helper.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  helper.alignment = { vertical: "middle", indent: 1 };
  sheet.getRow(7).height = 25;

  const header = sheet.getRow(8);
  header.values = ["Garage", "Período", "Consumos", "Importe total", "Vencimiento", "Estado"];
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const statusColors = {
    "Al día": ["FFDCFCE7", "FF166534"], Pendiente: ["FFDBEAFE", "FF1D4ED8"],
    "Próximo a vencer": ["FFFEF3C7", "FF92400E"], Vencido: ["FFFEE2E2", "FF991B1B"],
  };
  cuentas.forEach((cuenta, index) => {
    const rowNumber = firstDataRow + index;
    const row = sheet.getRow(rowNumber);
    row.values = [cuenta.garage, cuenta.periodo, cuenta.consumos, cuenta.importe, new Date(`${cuenta.vencimiento}T00:00:00`), cuenta.estado];
    row.height = 25;
    row.eachCell((cell) => {
      cell.font = { size: 10, color: { argb: "FF334155" } };
      cell.alignment = { vertical: "middle" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
      if (index % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
    const statusCell = sheet.getCell(`F${rowNumber}`);
    const [fill, text] = statusColors[cuenta.estado] ?? ["FFF1F5F9", "FF475569"];
    statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    statusCell.font = { bold: true, size: 10, color: { argb: text } };
    statusCell.dataValidation = {
      type: "list", allowBlank: false, formulae: ['"Al día,Pendiente,Próximo a vencer,Vencido"'],
      showErrorMessage: true, errorTitle: "Estado no válido", error: "Elegí uno de los estados disponibles.",
    };
  });

  sheet.columns = [{ width: 34 }, { width: 19 }, { width: 14 }, { width: 20 }, { width: 18 }, { width: 22 }];
  sheet.getColumn(3).alignment = { horizontal: "center" };
  sheet.getColumn(4).numFmt = moneda; sheet.getColumn(4).alignment = { horizontal: "right" };
  sheet.getColumn(5).numFmt = "dd/mm/yyyy"; sheet.getColumn(5).alignment = { horizontal: "center" };
  sheet.getColumn(6).alignment = { horizontal: "center" };
  sheet.autoFilter = { from: "A8", to: `F${Math.max(lastDataRow, 8)}` };
  sheet.pageSetup.printArea = `A1:F${Math.max(lastDataRow, 8)}`;
  sheet.headerFooter.oddFooter = "&LSmartLot&CConfidencial&RPage &P of &N";

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `cuentas_corrientes_smartlot_${fechaArchivo()}.xlsx`);
};
