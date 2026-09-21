export interface TableExportColumn<T = Record<string, unknown>> {
  header: string;
  key: keyof T | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any, row: T) => string | number;
}

export type TableExportFormat = "csv" | "xlsx" | "pdf";

export interface TableExportOptions<T = Record<string, unknown>> {
  title: string;
  filename: string; // Sin extensión
  columns: TableExportColumn<T>[];
  data: T[];
  format: TableExportFormat;
}

/**
 * Obtiene el valor formateado de una celda para una columna dada.
 */
function getCellValue<T>(row: T, col: TableExportColumn<T>): string | number {
  const rawValue = (row as Record<string, unknown>)[col.key as string];
  if (col.formatter) {
    return col.formatter(rawValue, row);
  }
  if (rawValue === null || rawValue === undefined) {
    return "";
  }
  if (typeof rawValue === "boolean") {
    return rawValue ? "Sí" : "No";
  }
  if (typeof rawValue === "object") {
    return JSON.stringify(rawValue);
  }
  return String(rawValue);
}

/**
 * Exporta datos a CSV con soporte UTF-8 (BOM para compatibilidad con Excel)
 */
export function exportToCsv<T>(
  columns: TableExportColumn<T>[],
  data: T[],
  filename: string
) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = columns.map((col) => escapeCsv(col.header)).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCsv(getCellValue(row, col))).join(",")
  );

  const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta datos a Excel (.xlsx) usando lazy import de 'xlsx'
 */
export async function exportToExcel<T>(
  columns: TableExportColumn<T>[],
  data: T[],
  filename: string,
  sheetName = "Datos"
) {
  const XLSX = await import("xlsx");

  // Transformar filas con los nombres de cabecera amigables
  const formattedRows = data.map((row) => {
    const rowObj: Record<string, string | number> = {};
    columns.forEach((col) => {
      rowObj[col.header] = getCellValue(row, col);
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Calcular ancho dinámico para las columnas
  const colWidths = columns.map((col) => {
    let maxLength = col.header.length;
    data.forEach((row) => {
      const val = String(getCellValue(row, col));
      if (val.length > maxLength) {
        maxLength = Math.min(val.length, 50); // Cap en 50 caracteres para evitar columnas gigantes
      }
    });
    return { wch: Math.max(maxLength + 3, 10) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporta datos a documento PDF profesional usando jsPDF + jspdf-autotable
 */
export async function exportToPdf<T>(
  title: string,
  columns: TableExportColumn<T>[],
  data: T[],
  filename: string
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Si tiene más de 6 columnas, usar orientación horizontal (landscape)
  const orientation = columns.length > 6 ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Encabezado del documento
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 40, 45);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Generado: ${dateStr} • Total de registros: ${data.length}`, 40, 62);

  // Línea divisoria decorativa
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(40, 72, pageWidth - 40, 72);

  // Construir cuerpo de la tabla
  const headers = [columns.map((col) => col.header)];
  const body = data.map((row) =>
    columns.map((col) => String(getCellValue(row, col)))
  );

  autoTable(doc, {
    startY: 85,
    head: headers,
    body: body,
    margin: { left: 40, right: 40, bottom: 40 },
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    didDrawPage: (data) => {
      // Pie de página con numeración
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      const pageNumber = data.pageNumber;
      // @ts-expect-error internal pages count
      const totalPages = doc.internal.getNumberOfPages?.() ?? pageNumber;
      doc.text(
        `Página ${pageNumber} de ${totalPages}`,
        pageWidth - 40,
        pageHeight - 20,
        { align: "right" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Función central de exportación que despacha según el formato elegido
 */
export async function exportTableData<T>(options: TableExportOptions<T>): Promise<void> {
  const { title, filename, columns, data, format } = options;

  if (format === "csv") {
    exportToCsv(columns, data, filename);
  } else if (format === "xlsx") {
    await exportToExcel(columns, data, filename, title);
  } else if (format === "pdf") {
    await exportToPdf(title, columns, data, filename);
  }
}
