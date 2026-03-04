import Papa from "papaparse";

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: string; header: string }[]
) {
  if (data.length === 0) {
    if (columns) {
      const headers = columns.map((c) => c.header);
      const csvContent = Papa.unparse({ fields: headers, data: [] });
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return;
  }

  let csvContent: string;

  if (columns) {
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((c) => row[c.key] ?? ""));
    csvContent = Papa.unparse({ fields: headers, data: rows });
  } else {
    csvContent = Papa.unparse(data);
  }

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
