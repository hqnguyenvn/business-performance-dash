
import { PageHeader } from "@/components/PageHeader";
import { BarChart3 } from "lucide-react";

export const BusinessReportHeader = () => {
  return (
    <PageHeader
      title="Business Performance Report"
      description="Comprehensive report by year and month"
      icon={BarChart3}
    />
  );
};
