import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { usePlanVsActual } from "@/hooks/usePlanVsActual";
import { YEARS, monthShort } from "@/lib/months";
import { formatNumber } from "@/lib/format";

export default function PlanVsActual() {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const { data, loading } = usePlanVsActual(selectedYear);

  /**
   * Growth/achievement label for a (plan, actual) pair:
   *  - plan = 0 or actual = 0 (no data yet for that month) → undefined (recharts skips)
   *  - actual ≥ plan → "+X%" (variance above plan)
   *  - actual <  plan → "X% of plan" (fraction of plan)
   */
  const growthLabel = (actual: number, plan: number): string => {
    if (plan === 0 || actual === 0) return "";
    if (actual >= plan) {
      const pct = ((actual - plan) / plan) * 100;
      return `+${pct.toFixed(1)}%`;
    }
    return `${((actual / plan) * 100).toFixed(1)}% of plan`;
  };

  /**
   * Render a horizontal strip of monthly % pills under a chart. We tried
   * recharts LabelList but it silently no-ops in this version when dataKey
   * points to a non-numeric field, so this is the simpler reliable path.
   */
  const renderPctStrip = (
    rows: { name: string; pctLabel: string }[],
    label: string,
  ) => (
    <div className="px-4 pb-3 -mt-2">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => {
          if (!r.pctLabel) return null;
          const positive = r.pctLabel.startsWith("+");
          return (
            <span
              key={r.name}
              className={`text-xs px-2 py-0.5 rounded border ${
                positive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <span className="font-medium">{r.name}</span>
              <span className="ml-1.5 font-semibold">{r.pctLabel}</span>
            </span>
          );
        })}
      </div>
    </div>
  );

  const revenueChartData = useMemo(
    () =>
      data.map((d) => ({
        name: monthShort(d.month),
        plan: Math.round(d.plan_revenue / 1_000_000),
        actual: Math.round(d.actual_revenue / 1_000_000),
        pctLabel: growthLabel(d.actual_revenue, d.plan_revenue),
      })),
    [data],
  );

  const bmmChartData = useMemo(
    () =>
      data.map((d) => ({
        name: monthShort(d.month),
        plan: Number(d.plan_bmm) || 0,
        actual: Number(d.actual_bmm) || 0,
        pctLabel: growthLabel(d.actual_bmm, d.plan_bmm),
      })),
    [data],
  );

  const totals = useMemo(() => {
    const tPlan = data.reduce((s, r) => s + r.plan_revenue, 0);
    const tActual = data.reduce((s, r) => s + r.actual_revenue, 0);
    const tPlanBmm = data.reduce((s, r) => s + r.plan_bmm, 0);
    const tActualBmm = data.reduce((s, r) => s + r.actual_bmm, 0);
    return {
      plan_revenue: tPlan,
      actual_revenue: tActual,
      plan_bmm: tPlanBmm,
      actual_bmm: tActualBmm,
    };
  }, [data]);

  const fmtPct = (actual: number, plan: number): { text: string; cls: string } => {
    if (plan === 0) return { text: "--", cls: "text-gray-500" };
    const pct = ((actual - plan) / Math.abs(plan)) * 100;
    const sign = pct > 0 ? "+" : "";
    const cls =
      pct > 0
        ? "text-green-600"
        : pct < 0
          ? "text-red-600"
          : "text-gray-500";
    return { text: `${sign}${pct.toFixed(1)}%`, cls };
  };

  /**
   * BMM achievement rule:
   *  - actual ≥ plan → "+X%" (growth above plan)  e.g. plan 100, actual 120 → "+20%"
   *  - actual <  plan → "Y% of plan" (fraction of plan) e.g. plan 100, actual 70 → "70% of plan"
   */
  const fmtBmm = (actual: number, plan: number): { text: string; cls: string } => {
    if (plan === 0) return { text: "--", cls: "text-gray-500" };
    if (actual >= plan) {
      const pct = ((actual - plan) / plan) * 100;
      return {
        text: `+${pct.toFixed(1)}%`,
        cls: pct === 0 ? "text-gray-500" : "text-green-600",
      };
    }
    const ratio = (actual / plan) * 100;
    return { text: `${ratio.toFixed(1)}% of plan`, cls: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Plan vs Actual"
        description="Monthly comparison of planned vs actual revenue (VND, converted at current exchange rate)"
        icon={TrendingUp}
      />

      <div className="p-6 space-y-6">
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Year</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly Plan vs Actual Revenue (Million VND)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `${formatNumber(value)}M VND`,
                        name === "plan" ? "Plan" : "Actual",
                      ]}
                      labelFormatter={(label: string) => `Month: ${label}`}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === "plan" ? "Plan" : "Actual"
                      }
                    />
                    <Bar dataKey="plan" fill="#94a3b8" name="plan" />
                    <Bar dataKey="actual" fill="#3b82f6" name="actual" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {!loading &&
              renderPctStrip(revenueChartData, "Actual revenue vs plan")}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly Plan vs Actual BMM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bmmChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `${formatNumber(value)} BMM`,
                        name === "plan" ? "Plan" : "Actual",
                      ]}
                      labelFormatter={(label: string) => `Month: ${label}`}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === "plan" ? "Plan" : "Actual"
                      }
                    />
                    <Bar dataKey="plan" fill="#94a3b8" name="plan" />
                    <Bar dataKey="actual" fill="#10b981" name="actual" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {!loading &&
              renderPctStrip(bmmChartData, "Actual BMM vs plan")}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border border-border">Month</TableHead>
                    <TableHead className="border border-border text-right">
                      Plan Revenue (VND)
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      Actual Revenue (VND)
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      Variance
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      % vs Plan
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      Plan BMM
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      Actual BMM
                    </TableHead>
                    <TableHead className="border border-border text-right">
                      BMM vs Plan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center p-4 text-gray-500">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((r) => {
                      const variance = r.actual_revenue - r.plan_revenue;
                      const pct = fmtPct(r.actual_revenue, r.plan_revenue);
                      const bmmPct = fmtBmm(r.actual_bmm, r.plan_bmm);
                      return (
                        <TableRow key={r.month}>
                          <TableCell className="border border-border font-medium">
                            {monthShort(r.month)}
                          </TableCell>
                          <TableCell className="border border-border text-right">
                            {formatNumber(r.plan_revenue)}
                          </TableCell>
                          <TableCell className="border border-border text-right">
                            {formatNumber(r.actual_revenue)}
                          </TableCell>
                          <TableCell
                            className={`border border-border text-right ${
                              variance > 0
                                ? "text-green-600"
                                : variance < 0
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {variance > 0 ? "+" : ""}
                            {formatNumber(variance)}
                          </TableCell>
                          <TableCell className={`border border-border text-right ${pct.cls}`}>
                            {pct.text}
                          </TableCell>
                          <TableCell className="border border-border text-right">
                            {formatNumber(r.plan_bmm)}
                          </TableCell>
                          <TableCell className="border border-border text-right">
                            {formatNumber(r.actual_bmm)}
                          </TableCell>
                          <TableCell className={`border border-border text-right ${bmmPct.cls}`}>
                            {bmmPct.text}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loading && data.length > 0 && (
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="border border-border">Total</TableCell>
                      <TableCell className="border border-border text-right">
                        {formatNumber(totals.plan_revenue)}
                      </TableCell>
                      <TableCell className="border border-border text-right">
                        {formatNumber(totals.actual_revenue)}
                      </TableCell>
                      {(() => {
                        const v = totals.actual_revenue - totals.plan_revenue;
                        const p = fmtPct(
                          totals.actual_revenue,
                          totals.plan_revenue,
                        );
                        return (
                          <>
                            <TableCell
                              className={`border border-border text-right ${
                                v > 0
                                  ? "text-green-600"
                                  : v < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {v > 0 ? "+" : ""}
                              {formatNumber(v)}
                            </TableCell>
                            <TableCell
                              className={`border border-border text-right ${p.cls}`}
                            >
                              {p.text}
                            </TableCell>
                          </>
                        );
                      })()}
                      <TableCell className="border border-border text-right">
                        {formatNumber(totals.plan_bmm)}
                      </TableCell>
                      <TableCell className="border border-border text-right">
                        {formatNumber(totals.actual_bmm)}
                      </TableCell>
                      {(() => {
                        const bp = fmtBmm(totals.actual_bmm, totals.plan_bmm);
                        return (
                          <TableCell
                            className={`border border-border text-right ${bp.cls}`}
                          >
                            {bp.text}
                          </TableCell>
                        );
                      })()}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
