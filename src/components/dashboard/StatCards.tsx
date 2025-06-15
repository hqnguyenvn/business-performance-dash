
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatCard {
  title: string;
  value: string;
  percentChange?: number | null;
  change: string;
  icon: React.ElementType;
  color: string;
}

interface StatCardsProps {
  stats: StatCard[];
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {stats.map((stat) => {
      let changeColor = "text-gray-500";
      if (typeof stat.percentChange === "number") {
        if (stat.percentChange > 0) changeColor = "text-green-600";
        else if (stat.percentChange < 0) changeColor = "text-red-600";
        else changeColor = "text-gray-500";
      }
      return (
        <Card key={stat.title} className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className={`text-xs mt-1 ${changeColor}`}>
              {stat.change !== undefined ? stat.change : "--"}{" "}
              compared to last month
            </p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
