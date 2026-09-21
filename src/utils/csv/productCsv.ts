import { CsvProductItem, csvProductItemSchema } from "@/validations/products.validations";

export interface ParsedCsvResult {
  validItems: CsvProductItem[];
  invalidRows: { row: number; data: Record<string, string>; errors: string[] }[];
  totalRows: number;
}

const CSV_HEADERS = [
  "sku",
  "name",
  "slug",
  "description",
  "price",
  "compare_at_price",
  "stock_quantity",
  "category_name",
  "brand_name",
  "condition",
  "is_digital",
  "is_active",
  "is_featured",
  "tags",
  "images",
] as const;

/**
 * Escapa un valor individual según la especificación RFC 4180
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val);

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ExportedVariant {
  sku?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  stock_quantity?: number | null;
  is_active?: boolean | null;
}

interface ExportedProduct {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  stock_quantity?: number | null;
  category?: { name?: string | null } | null;
  brand?: { name?: string | null } | null;
  condition?: string | null;
  is_digital?: boolean | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  tags?: string[] | null;
  images?: string[] | null;
  product_variants?: ExportedVariant[] | null;
}

/**
 * Genera el string CSV a partir de la lista de productos exportados de la BD
 */
export function generateCatalogCsv(products: ExportedProduct[]): string {
  const headerRow = CSV_HEADERS.join(",");

  const rows = products.map((prod) => {
    // Si tiene variantes, tomamos la primera activa o la primera disponible
    const primaryVariant =
      prod.product_variants?.find((v) => v.is_active) ??
      prod.product_variants?.[0];

    const sku = primaryVariant?.sku ?? "";
    const name = prod.name ?? "";
    const slug = prod.slug ?? "";
    const description = prod.description ?? "";
    const price = primaryVariant?.price ?? prod.price ?? 0;
    const compareAtPrice =
      primaryVariant?.compare_at_price ?? prod.compare_at_price ?? 0;
    const stock = primaryVariant?.stock_quantity ?? prod.stock_quantity ?? 0;
    const categoryName = prod.category?.name ?? "";
    const brandName = prod.brand?.name ?? "";
    const condition = prod.condition ?? "new";
    const isDigital = prod.is_digital ? "true" : "false";
    const isActive = prod.is_active ? "true" : "false";
    const isFeatured = prod.is_featured ? "true" : "false";
    const tags = Array.isArray(prod.tags) ? prod.tags.join(";") : "";
    const images = Array.isArray(prod.images) ? prod.images.join(";") : "";

    return [
      escapeCsvValue(sku),
      escapeCsvValue(name),
      escapeCsvValue(slug),
      escapeCsvValue(description),
      escapeCsvValue(price),
      escapeCsvValue(compareAtPrice),
      escapeCsvValue(stock),
      escapeCsvValue(categoryName),
      escapeCsvValue(brandName),
      escapeCsvValue(condition),
      escapeCsvValue(isDigital),
      escapeCsvValue(isActive),
      escapeCsvValue(isFeatured),
      escapeCsvValue(tags),
      escapeCsvValue(images),
    ].join(",");
  });

  return [headerRow, ...rows].join("\r\n");
}

/**
 * Dispara la descarga del archivo CSV en el navegador con codificación UTF-8 BOM
 */
export function downloadCsv(csvContent: string, fileName: string): void {
  // UTF-8 BOM (\uFEFF) para que Excel reconozca tildes y caracteres especiales automáticamente
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga una plantilla de ejemplo para importación
 */
export function downloadSampleTemplateCsv(): void {
  const sampleData = [
    CSV_HEADERS.join(","),
    [
      "CAM-BAS-001",
      "Camiseta Básica Algodón",
      "camiseta-basica-algodon",
      "Camiseta 100% algodón prelavado",
      "19.99",
      "24.99",
      "50",
      "Ropa",
      "Generica",
      "new",
      "false",
      "true",
      "false",
      "verano;algodon;basico",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    ]
      .map(escapeCsvValue)
      .join(","),
    [
      "TAZ-CER-002",
      "Taza de Cerámica 350ml",
      "taza-ceramica-350ml",
      "Taza resistente a microondas y lavavajillas",
      "9.50",
      "12.00",
      "120",
      "Hogar",
      "",
      "new",
      "false",
      "true",
      "true",
      "taza;cafe;ceramica",
      "",
    ]
      .map(escapeCsvValue)
      .join(","),
  ].join("\r\n");

  downloadCsv(sampleData, "plantilla-productos-ejemplo.csv");
}

/**
 * Parser de CSV compatible con RFC 4180 (maneja comillas dobles, comas internas y saltos de línea)
 */
export function parseRawCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;
  let i = 0;

  // Remover BOM si está presente
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Comilla doble escapada ("") dentro de comillas
          currentVal += '"';
          i += 2;
          continue;
        } else {
          // Fin del valor entrecomillado
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentVal += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentVal.trim());
        currentVal = "";
        i++;
        continue;
      } else if (char === "\r" || char === "\n") {
        currentRow.push(currentVal.trim());
        currentVal = "";
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === "\r" && nextChar === "\n") {
          i += 2;
        } else {
          i++;
        }
        continue;
      } else {
        currentVal += char;
        i++;
        continue;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parsea y valida el contenido de un archivo CSV subido
 */
export function parseAndValidateProductsCsv(csvText: string): ParsedCsvResult {
  const rawRows = parseRawCsv(csvText);

  if (rawRows.length === 0) {
    return { validItems: [], invalidRows: [], totalRows: 0 };
  }

  // Mapear encabezados a índices normalizados
  const rawHeaders = rawRows[0].map((h) =>
    h.toLowerCase().trim().replace(/[\s_-]+/g, "_")
  );

  const headerIndexMap: Record<string, number> = {};
  rawHeaders.forEach((header, index) => {
    headerIndexMap[header] = index;
  });

  const validItems: CsvProductItem[] = [];
  const invalidRows: { row: number; data: Record<string, string>; errors: string[] }[] =
    [];

  const dataRows = rawRows.slice(1);

  dataRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 por 1-indexed, +1 por encabezado
    const getValue = (key: string): string => {
      const colIndex = headerIndexMap[key];
      return colIndex !== undefined && row[colIndex] !== undefined
        ? row[colIndex]
        : "";
    };

    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] ?? "";
    });

    // Mapeo flexible de nombres de columnas comunes
    const name = getValue("name") || getValue("nombre") || getValue("producto");
    const sku = getValue("sku") || getValue("codigo");
    const slug = getValue("slug");
    const description = getValue("description") || getValue("descripcion");
    const priceStr = getValue("price") || getValue("precio");
    const compareAtPriceStr =
      getValue("compare_at_price") ||
      getValue("precio_comparacion") ||
      getValue("precio_tachado");
    const stockStr =
      getValue("stock_quantity") || getValue("stock") || getValue("cantidad");
    const categoryName = getValue("category_name") || getValue("categoria");
    const brandName = getValue("brand_name") || getValue("marca");
    const conditionStr = getValue("condition") || getValue("condicion");
    const isDigitalStr = getValue("is_digital") || getValue("digital");
    const isActiveStr = getValue("is_active") || getValue("activo");
    const isFeaturedStr = getValue("is_featured") || getValue("destacado");
    const tagsStr = getValue("tags") || getValue("etiquetas");
    const imagesStr = getValue("images") || getValue("imagenes");

    const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) : 0;
    const compareAtPrice = compareAtPriceStr
      ? parseFloat(compareAtPriceStr.replace(/[^0-9.-]+/g, ""))
      : 0;
    const stockQuantity = stockStr ? parseInt(stockStr.replace(/[^0-9-]+/g, ""), 10) : 0;

    const parseBool = (str: string, def: boolean): boolean => {
      if (!str) return def;
      const lower = str.toLowerCase().trim();
      return lower === "true" || lower === "si" || lower === "sí" || lower === "1";
    };

    const condition: "new" | "used" | "refurbished" =
      conditionStr === "used" || conditionStr === "usado"
        ? "used"
        : conditionStr === "refurbished" || conditionStr === "reacondicionado"
        ? "refurbished"
        : "new";

    const tags = tagsStr
      ? tagsStr.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
      : [];

    const images = imagesStr
      ? imagesStr.split(/[;,]/).map((img) => img.trim()).filter(Boolean)
      : [];

    const candidate = {
      name,
      sku: sku || undefined,
      slug: slug || undefined,
      description: description || undefined,
      price: isNaN(price) ? 0 : price,
      compare_at_price: isNaN(compareAtPrice) ? 0 : compareAtPrice,
      stock_quantity: isNaN(stockQuantity) ? 0 : Math.max(0, stockQuantity),
      category_name: categoryName || undefined,
      brand_name: brandName || undefined,
      condition,
      is_digital: parseBool(isDigitalStr, false),
      is_active: parseBool(isActiveStr, true),
      is_featured: parseBool(isFeaturedStr, false),
      tags,
      images,
    };

    const validationResult = csvProductItemSchema.safeParse(candidate);

    if (validationResult.success) {
      validItems.push(validationResult.data);
    } else {
      const errMsgs = validationResult.error.issues.map(
        (issue) => `${issue.path.map(String).join(".")}: ${issue.message}`
      );
      invalidRows.push({
        row: rowNumber,
        data: rowObj,
        errors: errMsgs,
      });
    }
  });

  return {
    validItems,
    invalidRows,
    totalRows: dataRows.length,
  };
}

export const productImportTemplateColumns = [
  { key: "name", label: "Nombre", example: "Camiseta Deportiva Pro", required: true },
  { key: "sku", label: "SKU", example: "CAM-DEP-001" },
  { key: "slug", label: "Slug", example: "camiseta-deportiva-pro" },
  { key: "price", label: "Precio", example: "29.99", required: true },
  { key: "compare_at_price", label: "Precio_Comparacion", example: "39.99" },
  { key: "stock_quantity", label: "Stock", example: "50" },
  { key: "category_name", label: "Categoria", example: "Ropa Deportiva" },
  { key: "brand_name", label: "Marca", example: "Nike" },
  { key: "description", label: "Descripcion", example: "Camiseta de alto rendimiento" },
  { key: "is_active", label: "Es_Activo", example: "true" },
  { key: "is_featured", label: "Es_Destacado", example: "false" },
];

/**
 * Valida un array de filas (objetos Record<string, string>) provenientes de CSV o XLSX
 */
export function validateProductRecordRows(rows: Record<string, string>[]): {
  validItems: CsvProductItem[];
  errors: { row: number; reason: string }[];
} {
  const validItems: CsvProductItem[] = [];
  const errors: { row: number; reason: string }[] = [];

  const parseBool = (v: string, def = false): boolean => {
    if (!v) return def;
    const lower = v.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "si" || lower === "sí" || lower === "yes";
  };

  rows.forEach((rowObj, idx) => {
    const rowNumber = idx + 2;

    const findVal = (...keys: string[]): string => {
      for (const k of keys) {
        for (const [rowKey, val] of Object.entries(rowObj)) {
          const normRowKey = rowKey.toLowerCase().trim().replace(/[\s_-]+/g, "_");
          if (normRowKey === k) return String(val ?? "").trim();
        }
      }
      return "";
    };

    const name = findVal("name", "nombre", "producto");
    const sku = findVal("sku", "codigo");
    const slug = findVal("slug");
    const description = findVal("description", "descripcion");
    const priceStr = findVal("price", "precio");
    const compareAtPriceStr = findVal("compare_at_price", "precio_comparacion", "precio_tachado");
    const stockStr = findVal("stock_quantity", "stock", "cantidad");
    const categoryName = findVal("category_name", "categoria");
    const brandName = findVal("brand_name", "marca");
    const conditionStr = findVal("condition", "condicion");
    const isDigitalStr = findVal("is_digital", "digital");
    const isActiveStr = findVal("is_active", "activo");
    const isFeaturedStr = findVal("is_featured", "destacado");
    const tagsStr = findVal("tags", "etiquetas");
    const imagesStr = findVal("images", "imagenes");

    const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) : 0;
    const compareAtPrice = compareAtPriceStr ? parseFloat(compareAtPriceStr.replace(/[^0-9.-]+/g, "")) : 0;
    const stockQuantity = stockStr ? parseInt(stockStr.replace(/[^0-9-]+/g, ""), 10) : 0;

    let condition: "new" | "used" | "refurbished" = "new";
    if (conditionStr) {
      const c = conditionStr.toLowerCase().trim();
      if (c === "used" || c === "usado") condition = "used";
      else if (c === "refurbished" || c === "reacondicionado") condition = "refurbished";
    }

    const tags = tagsStr
      ? tagsStr.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
      : [];

    const images = imagesStr
      ? imagesStr.split(/[;,]/).map((img) => img.trim()).filter(Boolean)
      : [];

    const candidate = {
      name,
      sku: sku || undefined,
      slug: slug || undefined,
      description: description || undefined,
      price: isNaN(price) ? 0 : price,
      compare_at_price: isNaN(compareAtPrice) ? 0 : compareAtPrice,
      stock_quantity: isNaN(stockQuantity) ? 0 : Math.max(0, stockQuantity),
      category_name: categoryName || undefined,
      brand_name: brandName || undefined,
      condition,
      is_digital: parseBool(isDigitalStr, false),
      is_active: parseBool(isActiveStr, true),
      is_featured: parseBool(isFeaturedStr, false),
      tags,
      images,
    };

    const result = csvProductItemSchema.safeParse(candidate);
    if (result.success) {
      validItems.push(result.data);
    } else {
      const errReason = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      errors.push({
        row: rowNumber,
        reason: errReason,
      });
    }
  });

  return { validItems, errors };
}

