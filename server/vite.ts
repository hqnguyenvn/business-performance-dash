
import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupVite(app: express.Application, server: any) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

export function serveStatic(app: express.Application) {
  const distPath = join(__dirname, "..", "dist");
  const indexPath = join(distPath, "index.html");

  if (!fs.existsSync(distPath)) {
    throw new Error("Build directory not found. Run 'npm run build' first.");
  }

  app.use(express.static(distPath));
  
  app.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
