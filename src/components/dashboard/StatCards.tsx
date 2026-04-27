import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatCard {
  title: string;
  value: string;
  percentChange?: number | null;
  change: string;
  icon: React.ElementType;
  color: string;
  /** % vs plan — undefined to hide the line, null when no plan exists. */
  planPercent?: number | null;
  /** Pre-formatted plan delta string (e.g. "+5.2%") shown next to the label. */
  planChange?: string;
}

interface StatCardsProps {
  groups: { label: string; stats: StatCard[] }[];
}

const colorForPercent = (pct: number | null | undefined): string => {
  if (typeof pct !== "number") return "text-gray-500";
  if (pct > 0) return "text-green-600";
  if (pct < 0) return "text-red-600";
  return "text-gray-500";
};

const CardItem: React.FC<{ stat: StatCard }> = ({ stat }) => {
  const changeColor = colorForPercent(stat.percentChange);
  let valueColor = "text-gray-900";
  if (typeof stat.percentChange === "number") {
    if (stat.percentChange > 0) valueColor = "text-primary";
    else if (stat.percentChange < 0) valueColor = "text-orange-500";
  }
  const showPlan = stat.planPercent !== undefined;
  const planColor = colorForPercent(stat.planPercent);
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
        <stat.icon className={`h-4 w-4 ${stat.color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{stat.value}</div>
        {showPlan && (
          <p className={`text-xs mt-1 ${planColor}`}>
            {stat.planChange ?? "--"} Compared to plan
          </p>
        )}
        <p className={`text-xs mt-1 ${changeColor}`}>
          {stat.change !== undefined ? stat.change : "--"} Compared to last year
        </p>
      </CardContent>
    </Card>
  );
};

export const StatCards: React.FC<StatCardsProps> = ({ groups }) => (
  <div className="space-y-4 mb-6">
    {groups.map((group) => (
      <section key={group.label}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {group.label}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {group.stats.map((stat) => <CardItem key={stat.title} stat={stat} />)}
        </div>
      </section>
    ))}
  </div>
);
