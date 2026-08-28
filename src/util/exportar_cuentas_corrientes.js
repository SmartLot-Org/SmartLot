const fechaArchivo = () => new Date().toISOString().slice(0, 10);
const monedaTexto = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n ?? 0);
const duracion = (m = 0) => `${Math.floor(m / 60)} h ${m % 60} min`;

export const exportarCuentasPDF = async (items, summary) => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('SmartLot · Consumos generados', 16, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 16, 22);
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(`Importe generado: ${monedaTexto(summary.importeGenerado)}`, 16, 42);
  doc.text(`Reservas utilizadas: ${summary.reservasUtilizadas}`, 112, 42);
  doc.text(`Tiempo utilizado: ${duracion(summary.minutosTotales)}`, 205, 42);
  autoTable(doc, { startY: 50, head: [['Garage', 'Sede', 'Período', 'Reservas', 'Minutos', 'Importe generado']], body: items.map((i) => [i.garage, i.sede, i.periodo, i.reservasUtilizadas, i.minutosTotales, monedaTexto(i.importeGenerado)]), theme: 'grid', styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [30, 41, 59] }, columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } }, margin: { left: 16, right: 16 } });
  doc.save(`consumos_generados_smartlot_${fechaArchivo()}.pdf`);
};

export const exportarCuentasExcel = async (items, summary) => {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')]);
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'SmartLot'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Consumos generados', { views: [{ state: 'frozen', ySplit: 5, showGridLines: false }] });
  sheet.mergeCells('A1:F1'); sheet.getCell('A1').value = 'SmartLot · Consumos generados'; sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }; sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }; sheet.getRow(1).height = 38;
  sheet.mergeCells('A2:F2'); sheet.getCell('A2').value = `Importe generado: ${monedaTexto(summary.importeGenerado)} · Reservas: ${summary.reservasUtilizadas} · Tiempo: ${duracion(summary.minutosTotales)}`;
  const header = sheet.getRow(4); header.values = ['Garage', 'Sede', 'Período', 'Reservas utilizadas', 'Minutos utilizados', 'Importe generado']; header.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; });
  items.forEach((item) => { const row = sheet.addRow([item.garage, item.sede, item.periodo, item.reservasUtilizadas, item.minutosTotales, item.importeGenerado]); row.eachCell((cell) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }; }); });
  sheet.columns = [{ width: 34 }, { width: 28 }, { width: 14 }, { width: 20 }, { width: 20 }, { width: 22 }]; sheet.getColumn(6).numFmt = '[$$-es-AR] #,##0.00'; sheet.autoFilter = { from: 'A4', to: `F${Math.max(4, items.length + 4)}` };
  const buffer = await workbook.xlsx.writeBuffer(); saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `consumos_generados_smartlot_${fechaArchivo()}.xlsx`);
};
