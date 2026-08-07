const monedaExcel = '[$$-es-AR] #,##0';
const monedaTexto = (valor) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor);
const fechaTexto = (valor) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${valor}T00:00:00Z`));

const nombreBase = (garage, periodo) => `deudas_${garage.toLowerCase().replaceAll(" ", "_")}_${periodo.toLowerCase().replaceAll(" ", "_")}`;

export async function exportarDeudasGaragePDF(empresas, { garage, periodo }) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const deudaTotal = empresas.reduce((total, empresa) => total + empresa.deudaActual, 0);
  const vencida = empresas.filter((empresa) => empresa.estado === "Vencida").reduce((total, empresa) => total + empresa.deudaActual, 0);

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 297, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(`${garage} · Cuentas por cobrar`, 15, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${periodo} · Empresas asociadas que le deben dinero a ${garage}`, 15, 21);

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Las empresas le deben a ${garage}: ${monedaTexto(deudaTotal)}`, 15, 41);
  doc.text(`Deuda vencida a favor del garage: ${monedaTexto(vencida)}`, 125, 41);
  doc.text(`Empresas exportadas: ${empresas.length}`, 210, 41);

  autoTable(doc, {
    startY: 49,
    head: [["Empresa que debe", "CUIT", "Reservas", "Total generado", "Ya pagó", "Le debe al garage", "Vencimiento", "Estado"]],
    body: empresas.map((empresa) => [empresa.nombreEmpresa, empresa.cuit, empresa.reservasUtilizadas, monedaTexto(empresa.totalGenerado), monedaTexto(empresa.totalPagado), monedaTexto(empresa.deudaActual), fechaTexto(empresa.fechaVencimiento), empresa.estado]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right", fontStyle: "bold", textColor: [29, 78, 216] } },
    margin: { left: 15, right: 15 },
  });

  const paginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Reporte generado desde SmartLot", 15, 200);
    doc.text(`Página ${pagina} de ${paginas}`, 282, 200, { align: "right" });
  }
  doc.save(`${nombreBase(garage, periodo)}.pdf`);
}

export async function exportarDeudasGarageExcel(empresas, { garage, periodo }) {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import("exceljs"),
    import("file-saver"),
  ]);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SmartLot";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Cuentas por cobrar", {
    views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
    properties: { tabColor: { argb: "FF2563EB" } },
  });

  sheet.mergeCells("A1:H1");
  const titulo = sheet.getCell("A1");
  titulo.value = `SmartLot · Deudas con ${garage}`;
  titulo.font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  titulo.alignment = { vertical: "middle", indent: 1 };
  sheet.getRow(1).height = 38;

  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = `${periodo} · Empresas asociadas que le deben dinero a ${garage}`;
  sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  sheet.getCell("A2").alignment = { vertical: "middle", indent: 1 };
  sheet.getRow(2).height = 24;

  const deudaTotal = empresas.reduce((total, empresa) => total + empresa.deudaActual, 0);
  const vencida = empresas.filter((empresa) => empresa.estado === "Vencida").reduce((total, empresa) => total + empresa.deudaActual, 0);
  sheet.getCell("A4").value = "TOTAL POR COBRAR";
  sheet.getCell("B4").value = deudaTotal;
  sheet.getCell("D4").value = "DEUDA VENCIDA";
  sheet.getCell("E4").value = vencida;
  sheet.getCell("G4").value = "EMPRESAS";
  sheet.getCell("H4").value = empresas.length;
  ["A4", "D4", "G4"].forEach((ref) => { sheet.getCell(ref).font = { bold: true, size: 9, color: { argb: "FF64748B" } }; });
  ["B4", "E4", "H4"].forEach((ref) => { sheet.getCell(ref).font = { bold: true, size: 14, color: { argb: ref === "E4" ? "FFDC2626" : "FF1D4ED8" } }; });
  sheet.getCell("B4").numFmt = monedaExcel;
  sheet.getCell("E4").numFmt = monedaExcel;

  const header = sheet.getRow(6);
  header.values = ["Empresa que debe", "CUIT", "Reservas", "Total generado", "Ya pagó", "Le debe al garage", "Vencimiento", "Estado"];
  header.height = 30;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  empresas.forEach((empresa, index) => {
    const row = sheet.getRow(7 + index);
    row.values = [empresa.nombreEmpresa, empresa.cuit, empresa.reservasUtilizadas, empresa.totalGenerado, empresa.totalPagado, empresa.deudaActual, new Date(`${empresa.fechaVencimiento}T00:00:00`), empresa.estado];
    row.height = 26;
    row.eachCell((cell) => {
      cell.font = { size: 10, color: { argb: "FF334155" } };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
      cell.alignment = { vertical: "middle" };
      if (index % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
    row.getCell(6).font = { bold: true, size: 10, color: { argb: "FF1D4ED8" } };
  });

  sheet.columns = [{ width: 27 }, { width: 18 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 21 }, { width: 17 }, { width: 16 }];
  [4, 5, 6].forEach((column) => { sheet.getColumn(column).numFmt = monedaExcel; sheet.getColumn(column).alignment = { horizontal: "right" }; });
  sheet.getColumn(7).numFmt = "dd/mm/yyyy";
  sheet.autoFilter = { from: "A6", to: `H${Math.max(6, 6 + empresas.length)}` };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${nombreBase(garage, periodo)}.xlsx`);
}
