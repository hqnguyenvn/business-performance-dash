import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export type ColumnType = "string" | "number" | "integer" | "date";

export interface LookupOption {
  code: string;
  name?: string;
}

export interface ExcelColumn {
  key: string;
  header: string;
  type?: ColumnType;
  width?: number;
  required?: boolean;
  lookup?: string;
  formatter?: (value: any, row: any) => any;
}

export interface ExcelSchema {
  sheetName: string;
  columns: ExcelColumn[];
  lookups?: Record<string, LookupOption[]>;
}

export interface ImportError {
  rowIndex: number;
  columns: string[];
  reason: string;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E5BA8" },
};

const makeErrorFill = (): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFEE2E2" },
});

const makeErrorHeaderFill = (): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDC2626" },
});

const colLetter = (n: number): string => {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const formatLookupDisplay = (opt: LookupOption): string => opt.code;

/**
 * Normalize a string for lookup comparison: collapse whitespace (including
 * NBSP, tab, em-space, …), trim, lowercase. Excel cells frequently carry
 * non-breaking spaces that look identical to regular spaces but compare
 * unequal — this hides the difference.
 */
export const normalizeLookupKey = (s: string): string =>
  s
    .replace(/[\s  -​  　﻿]+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Parse a cell value coming from a lookup column.
 *
 * Lookup cells may carry either the bare code ("TMU - MISEPURI") or a
 * legacy "CODE - NAME" composite ("VND - Việt Nam Đồng"). To support both
 * we first check whether the raw value already matches a known code; only
 * fall back to splitting on " - " when it doesn't. Pass the lookup options
 * to enable this; without them we return the raw string (no split) which
 * is safer than the old "always split" behaviour.
 *
 * Comparison is whitespace-insensitive (NBSP and friends → regular space)
 * to survive copy-paste from Excel.
 */
export const parseLookupCode = (
  value: unknown,
  options?: LookupOption[],
): string => {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  if (options && options.length) {
    const key = normalizeLookupKey(s);
    const direct = options.find((o) => normalizeLookupKey(o.code) === key);
    if (direct) return direct.code; // canonical code from master
  }
  const idx = s.indexOf(" - ");
  return idx > 0 ? s.slice(0, idx).trim() : s;
};

export async function exportExcel<T extends Record<string, any>>(opts: {
  schema: ExcelSchema;
  rows: T[];
  fileName: string;
}): Promise<void> {
  const { schema, rows, fileName } = opts;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP System";
  wb.created = new Date();

  const ws = wb.addWorksheet(schema.sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = schema.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? Math.max(12, c.header.length + 4),
  }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  // Add lookup sheets (veryHidden)
  const lookupRefs: Record<string, string> = {};
  if (schema.lookups) {
    for (const [name, options] of Object.entries(schema.lookups)) {
      if (!options.length) continue;
      const sheetName = `_lookup_${name}`.slice(0, 31);
      const lws = wb.addWorksheet(sheetName, { state: "veryHidden" });
      options.forEach((opt, i) => {
        lws.getCell(`A${i + 1}`).value = formatLookupDisplay(opt);
      });
      lookupRefs[name] = `='${sheetName}'!$A$1:$A$${options.length}`;
    }
  }

  // Add data rows
  rows.forEach((row) => {
    const obj: Record<string, any> = {};
    schema.columns.forEach((c) => {
      let v = row[c.key];
      if (c.formatter) v = c.formatter(v, row);
      if (c.lookup && v && schema.lookups?.[c.lookup]) {
        const match = schema.lookups[c.lookup].find((o) => o.code === v);
        if (match) v = formatLookupDisplay(match);
      }
      obj[c.key] = v;
    });
    ws.addRow(obj);
  });

  // Apply data validation for lookup columns
  const MAX_VALIDATION_ROWS = 5000;
  schema.columns.forEach((c, idx) => {
    if (!c.lookup || !lookupRefs[c.lookup]) return;
    const letter = colLetter(idx + 1);
    for (let r = 2; r <= MAX_VALIDATION_ROWS + 1; r++) {
      ws.getCell(`${letter}${r}`).dataValidation = {
        type: "list",
        allowBlank: !c.required,
        formulae: [lookupRefs[c.lookup]],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Giá trị không hợp lệ",
        error: `Vui lòng chọn từ danh sách hoặc nhập đúng mã trong cột ${c.header}.`,
      };
    }
  });

  // Number format for numeric columns
  schema.columns.forEach((c, idx) => {
    if (c.type === "number") {
      ws.getColumn(idx + 1).numFmt = "#,##0.00";
    } else if (c.type === "integer") {
      ws.getColumn(idx + 1).numFmt = "0";
    }
  });

  // Apply borders to used range
  const lastRow = Math.max(1, rows.length + 1);
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= schema.columns.length; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

export async function parseExcel(opts: {
  file: File;
  schema: ExcelSchema;
}): Promise<{ rows: Record<string, any>[]; rawHeaders: string[] }> {
  const { file, schema } = opts;
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.getWorksheet(schema.sheetName) ?? wb.worksheets.find((w) => !w.name.startsWith("_lookup_"));
  if (!ws) throw new Error(`Không tìm thấy sheet "${schema.sheetName}" trong file.`);

  const headerRow = ws.getRow(1);
  // Map actual colNumber → key based on schema headers
  const colNumberToKey: Record<number, string> = {};
  const rawHeaders: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = String(cell.value ?? "").trim();
    rawHeaders.push(text);
    const match = schema.columns.find((c) => c.header.toLowerCase() === text.toLowerCase());
    if (match) colNumberToKey[colNumber] = match.key;
  });

  const rows: Record<string, any>[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    let hasValue = false;
    for (const [colNumStr, key] of Object.entries(colNumberToKey)) {
      const colNum = Number(colNumStr);
      const col = schema.columns.find((c) => c.key === key)!;
      let v: any = row.getCell(colNum).value;
      if (v && typeof v === "object") {
        if ("richText" in v) v = (v as any).richText.map((t: any) => t.text).join("");
        else if ("text" in v) v = (v as any).text;
        else if ("result" in v) v = (v as any).result;
      }
      if (col.lookup) {
        v = parseLookupCode(v, schema.lookups?.[col.lookup]);
      } else if (typeof v === "string") v = v.trim();
      if (v !== null && v !== undefined && v !== "") hasValue = true;
      obj[key] = v;
    }
    if (hasValue) {
      obj.__rowNumber = rowNumber;
      rows.push(obj);
    }
  });

  return { rows, rawHeaders };
}

export async function buildErrorFile(opts: {
  file: File;
  errors: ImportError[];
  schema: ExcelSchema;
  fileName: string;
}): Promise<void> {
  const { file, errors, schema, fileName } = opts;
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.getWorksheet(schema.sheetName) ?? wb.worksheets.find((w) => !w.name.startsWith("_lookup_"));
  if (!ws) throw new Error(`Không tìm thấy sheet "${schema.sheetName}".`);

  const headerRow = ws.getRow(1);
  const headerMap: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headerMap[String(cell.value ?? "").trim().toLowerCase()] = colNumber;
  });

  // Count only schema-matched columns (exclude any stale "Error" column from a prior run)
  const schemaHeaders = new Set(schema.columns.map((c) => c.header.toLowerCase()));
  const dataColumnCount = Object.keys(headerMap).filter((h) => schemaHeaders.has(h)).length;
  const errorColNumber = dataColumnCount + 1;

  // exceljs shares style object references between cells that came from column definitions.
  // Use cell.style = {...} to break the shared reference.
  const setCellStyle = (cell: ExcelJS.Cell, patch: Partial<ExcelJS.Style>) => {
    cell.style = { ...(cell.style || {}), ...patch } as ExcelJS.Style;
  };

  // Clear any pre-existing red fills and stale error cells (re-uploaded error file case)
  const lastRow = ws.rowCount;
  const noFill = { type: "pattern", pattern: "none" } as any;
  for (let r = 2; r <= lastRow; r++) {
    for (let c = 1; c <= Math.max(ws.columnCount, dataColumnCount + 5); c++) {
      const cell = ws.getCell(r, c);
      if (cell.fill && (cell.fill as any).fgColor?.argb === "FFFEE2E2") {
        setCellStyle(cell, { fill: noFill });
      }
      if (c > dataColumnCount) {
        cell.value = null;
      }
    }
  }
  for (let c = dataColumnCount + 1; c <= ws.columnCount; c++) {
    const hc = ws.getCell(1, c);
    hc.value = null;
    setCellStyle(hc, { fill: noFill });
  }

  const errorHeaderCell = ws.getCell(1, errorColNumber);
  errorHeaderCell.value = "Error";
  setCellStyle(errorHeaderCell, {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: makeErrorHeaderFill(),
    alignment: { vertical: "middle", horizontal: "center" },
  });
  ws.getColumn(errorColNumber).width = 60;

  errors.forEach((err) => {
    const rowNum = err.rowIndex;
    err.columns.forEach((colHeader) => {
      const colNum = headerMap[colHeader.toLowerCase()];
      if (colNum) setCellStyle(ws.getCell(rowNum, colNum), { fill: makeErrorFill() });
    });
    const errCell = ws.getCell(rowNum, errorColNumber);
    errCell.value = err.reason;
    setCellStyle(errCell, {
      fill: makeErrorFill(),
      alignment: { wrapText: true, vertical: "top" },
    });
  });

  const outBuf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

export async function downloadTemplate(opts: {
  schema: ExcelSchema;
  fileName: string;
}): Promise<void> {
  return exportExcel({ ...opts, rows: [] });
}
