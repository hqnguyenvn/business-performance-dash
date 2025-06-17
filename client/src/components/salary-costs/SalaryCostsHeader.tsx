
import { PageHeader } from "@/components/PageHeader";
import { Users } from "lucide-react";

export const SalaryCostsHeader = () => {
  return (
    <PageHeader
      title="Salary Costs by Customer"
      description="Record salary costs by customer"
      icon={Users}
    />
  );
};
