
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";

interface BusinessReportHeaderProps {
  onExport: () => void;
}

export const BusinessReportHeader = ({ onExport }: BusinessReportHeaderProps) => {
  return (
    <PageHeader
      title="Business Performance Report"
      description="Comprehensive report by year and month"
      icon={BarChart3}
      actions={
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      }
    />
  );
};

