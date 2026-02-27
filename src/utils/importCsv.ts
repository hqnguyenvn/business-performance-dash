import Papa from "papaparse";

export interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export function parseCsvFile<T = Record<string, string>>(
  file: File
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(
            (e) => `Row ${e.row}: ${e.message}`
          );
          reject(new Error(errorMessages.join("; ")));
          return;
        }
        resolve(results.data as T[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
