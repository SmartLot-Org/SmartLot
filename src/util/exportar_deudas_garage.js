const money = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n ?? 0);
const safe = (s) => String(s || 'garages').toLowerCase().replace(/[^a-z0-9]+/g, '_');

export async function exportarDeudasGaragePDF(items, { garage, periodo }) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, 297, 30, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(19); doc.text('SmartLot · Consumos generados', 15, 13); doc.setFontSize(9); doc.text(`${garage} · ${periodo}`, 15, 21);
  autoTable(doc, { startY: 40, head: [['Empresa', 'Sede', 'Garage', 'Período', 'Reservas', 'Minutos', 'Importe generado']], body: items.map((i) => [i.empresa, i.sede, i.garage, i.periodo, i.reservasUtilizadas, i.minutosTotales, money(i.importeGenerado)]), theme: 'grid', headStyles: { fillColor: [30, 41, 59] }, columnStyles: { 6: { halign: 'right', fontStyle: 'bold' } } });
  doc.save(`consumos_${safe(garage)}_${safe(periodo)}.pdf`);
}

export async function exportarDeudasGarageExcel(items, { garage, periodo }) {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')]);
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Consumos generados');
  sheet.addRow(['SmartLot · Consumos generados']); sheet.addRow([garage, periodo]); sheet.addRow([]);
  const header = sheet.addRow(['Empresa', 'Sede', 'Garage', 'Período', 'Reservas', 'Minutos', 'Importe generado']); header.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; });
  items.forEach((i) => sheet.addRow([i.empresa, i.sede, i.garage, i.periodo, i.reservasUtilizadas, i.minutosTotales, i.importeGenerado]));
  sheet.columns = [{ width: 28 }, { width: 25 }, { width: 28 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 20 }]; sheet.getColumn(7).numFmt = '[$$-es-AR] #,##0.00';
  const buffer = await workbook.xlsx.writeBuffer(); saveAs(new Blob([buffer]), `consumos_${safe(garage)}_${safe(periodo)}.xlsx`);
}
