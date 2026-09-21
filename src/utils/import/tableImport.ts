export interface TableImportColumnConfig {
  key: string;
  label: string;
  example: string | number;
  required?: boolean;
}

export interface ParsedSpreadsheetResult {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parsea un archivo de texto en formato CSV o TSV
 */
function parseCsvContent(text: string): ParsedSpreadsheetResult {
  // Limpiar BOM UTF-8 si existe
  const cleanText = text.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detectar delimitador (coma o punto y coma)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    // Ignorar filas totalmente vacías
    if (rawValues.every((v) => v === "")) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = rawValues[idx] !== undefined ? rawValues[idx] : "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parsea un archivo de hoja de cálculo ya sea CSV, XLSX o XLS
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheetResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv" || extension === "tsv") {
    const text = await file.text();
    return parseCsvContent(text);
  }

  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return { headers: [], rows: [] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: "",
      raw: false, // Convertir todo a string para consistencia
    });

    if (rawData.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(rawData[0]);
    const rows = rawData.map((item) => {
      const stringifiedRow: Record<string, string> = {};
      headers.forEach((header) => {
        stringifiedRow[header] = String(item[header] ?? "").trim();
      });
      return stringifiedRow;
    });

    return { headers, rows };
  }

  throw new Error(
    `Formato de archivo no compatible (.${extension}). Por favor sube un archivo .csv o .xlsx.`
  );
}

/**
 * Genera y descarga una plantilla de ejemplo para importación en formato CSV o XLSX
 */
export async function downloadImportTemplate(
  filenamePrefix: string,
  columns: TableImportColumnConfig[],
  format: "csv" | "xlsx" = "xlsx"
) {
  const exampleRow: Record<string, string | number> = {};
  columns.forEach((col) => {
    exampleRow[col.label] = col.example;
  });

  if (format === "csv") {
    const headers = columns.map((c) => `"${c.label}"`).join(",");
    const values = columns.map((c) => `"${c.example}"`).join(",");
    const csvContent = "\uFEFF" + [headers, values].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plantilla-${filenamePrefix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([exampleRow]);
    ws["!cols"] = columns.map((c) => ({
      wch: Math.max(c.label.length, String(c.example).length, 12) + 3,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, `plantilla-${filenamePrefix}.xlsx`);
  }
}
