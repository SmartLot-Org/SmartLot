export const GARAGE_ACTUAL = "Parking Palermo";

export const PERIODOS_CUENTAS_POR_COBRAR = [
  { id: "2026-08", nombre: "Agosto 2026" },
  { id: "2026-07", nombre: "Julio 2026" },
];

export const ESTADOS_DEUDA = ["Al día", "Debe", "Por vencer", "Vencida"];

export const cuentasPorCobrarGarageMock = [
  {
    id: "cpg-001", nombreEmpresa: "NovaTech S.A.", cuit: "30-71628495-2",
    periodoId: "2026-08", reservasUtilizadas: 38, totalGenerado: 620000,
    totalPagado: 400000, deudaActual: 220000, fechaVencimiento: "2026-08-18", estado: "Debe",
    movimientos: [
      { id: "nov-1", fecha: "2026-08-04", concepto: "Reserva utilizada por un empleado", importe: 220000 },
      { id: "nov-2", fecha: "2026-08-01", concepto: "Liquidación mensual generada", importe: 620000 },
      { id: "nov-3", fecha: "2026-08-06", concepto: "Pago recibido de la empresa", importe: -400000 },
    ],
  },
  {
    id: "cpg-002", nombreEmpresa: "Andes Logística", cuit: "30-70984712-8",
    periodoId: "2026-08", reservasUtilizadas: 44, totalGenerado: 720000,
    totalPagado: 300000, deudaActual: 420000, fechaVencimiento: "2026-08-03", estado: "Vencida",
    movimientos: [
      { id: "and-1", fecha: "2026-07-31", concepto: "Liquidación mensual generada", importe: 720000 },
      { id: "and-2", fecha: "2026-08-01", concepto: "Pago recibido de la empresa", importe: -300000 },
      { id: "and-3", fecha: "2026-08-03", concepto: "Vencimiento de la liquidación", importe: 0 },
    ],
  },
  {
    id: "cpg-003", nombreEmpresa: "Estudio Prisma", cuit: "30-71833026-9",
    periodoId: "2026-08", reservasUtilizadas: 29, totalGenerado: 510000,
    totalPagado: 360000, deudaActual: 150000, fechaVencimiento: "2026-08-10", estado: "Por vencer",
    movimientos: [
      { id: "pri-1", fecha: "2026-08-01", concepto: "Liquidación mensual generada", importe: 510000 },
      { id: "pri-2", fecha: "2026-08-05", concepto: "Pago recibido de la empresa", importe: -360000 },
    ],
  },
  {
    id: "cpg-004", nombreEmpresa: "Mercurio Digital", cuit: "30-71449008-3",
    periodoId: "2026-08", reservasUtilizadas: 35, totalGenerado: 659500,
    totalPagado: 165000, deudaActual: 494500, fechaVencimiento: "2026-08-22", estado: "Debe",
    movimientos: [
      { id: "mer-1", fecha: "2026-08-01", concepto: "Liquidación mensual generada", importe: 674500 },
      { id: "mer-2", fecha: "2026-08-02", concepto: "Ajuste o descuento", importe: -15000 },
      { id: "mer-3", fecha: "2026-08-06", concepto: "Pago recibido de la empresa", importe: -165000 },
    ],
  },
  {
    id: "cpg-005", nombreEmpresa: "Grupo Horizonte", cuit: "30-69731584-6",
    periodoId: "2026-08", reservasUtilizadas: 47, totalGenerado: 780000,
    totalPagado: 780000, deudaActual: 0, fechaVencimiento: "2026-08-12", estado: "Al día",
    movimientos: [
      { id: "hor-1", fecha: "2026-08-01", concepto: "Liquidación mensual generada", importe: 780000 },
      { id: "hor-2", fecha: "2026-08-04", concepto: "Pago recibido de la empresa", importe: -780000 },
    ],
  },
  {
    id: "cpg-006", nombreEmpresa: "Constructora Sur", cuit: "30-68892017-6",
    periodoId: "2026-08", reservasUtilizadas: 40, totalGenerado: 625000,
    totalPagado: 625000, deudaActual: 0, fechaVencimiento: "2026-08-15", estado: "Al día",
    movimientos: [
      { id: "sur-1", fecha: "2026-08-01", concepto: "Liquidación mensual generada", importe: 625000 },
      { id: "sur-2", fecha: "2026-08-05", concepto: "Pago recibido de la empresa", importe: -625000 },
    ],
  },
];
