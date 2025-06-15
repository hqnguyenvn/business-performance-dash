
import { PageHeader } from "@/components/PageHeader";
import { BarChart3 } from "lucide-react";

export const BusinessReportHeader = () => {
  // Bỏ nút Sign Out theo hướng dẫn hình, chỉ giữ lại tiêu đề và icon
  return (
    <PageHeader
      title="Business Performance Report"
      description="Comprehensive report by year and month"
      icon={BarChart3}
    />
  );
};
