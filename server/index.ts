import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { ZodError } from "zod";
import { env, isProd } from "./env";
import { authRouter } from "./auth/routes";
import { parametersRouter } from "./routes/parameters";
import { rolesRouter } from "./routes/roles";
import { masterDataRouter } from "./routes/masterData";
import { exchangeRatesRouter } from "./routes/exchangeRates";
import { employeesRouter } from "./routes/employees";
import { salaryCostsRouter } from "./routes/salaryCosts";
import { costsRouter } from "./routes/costs";
import { revenuesRouter } from "./routes/revenues";
import { plansRouter } from "./routes/plans";
import { bonusRouter } from "./routes/bonus";
import { usersRouter } from "./routes/users";
import { reportsRouter } from "./routes/reports";
import { attachUser } from "./auth/middleware";

// Server entry
const app = express();

// Security headers. In dev we disable CSP so Vite HMR + inline scripts work
// through the proxy. In prod you should set a strict CSP.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Trust the Vite proxy hop so req.ip is accurate in dev
app.set("trust proxy", 1);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Auth routes
app.use("/api/auth", authRouter);

// Attach req.user (from JWT cookie) to all data routes for requireAuth
app.use("/api", attachUser);

// Data routes
app.use("/api/parameters", parametersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api", masterDataRouter);
app.use("/api/exchange-rates", exchangeRatesRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/salary-costs", salaryCostsRouter);
app.use("/api/costs", costsRouter);
app.use("/api/revenues", revenuesRouter);
app.use("/api/plans", plansRouter);
app.use("/api", bonusRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);

// -----------------------------------------------------------------------------
// 404 fallback for unknown API routes
// -----------------------------------------------------------------------------
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// -----------------------------------------------------------------------------
// Global error handler — must be last app.use.
// Prevents stack traces leaking to clients and normalizes error responses.
// -----------------------------------------------------------------------------
app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // Zod errors thrown via synchronous validator (rare — we mostly use middleware)
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    // Drizzle / pg errors: expose only a safe message
    const anyErr = err as { code?: string; message?: string; status?: number };
    const status = anyErr.status && anyErr.status >= 400 && anyErr.status < 600
      ? anyErr.status
      : 500;

    // Log server-side with full detail
    console.error("[error]", req.method, req.originalUrl, err);

    // Never return stack traces or internal messages to the client in prod.
    const message = !isProd && anyErr.message ? anyErr.message : "Internal server error";
    res.status(status).json({ error: message });
  },
);

// Production: serve frontend static files
if (isProd) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distDir = path.resolve(__dirname, "..", "dist");
  app.use(express.static(distDir));
  app.get(/.*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
});
