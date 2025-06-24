
import { PageHeader } from "@/components/PageHeader";
import { Users } from "lucide-react";

export const SalaryCostsHeader = () => {
  return (
    <PageHeader
      title="Cost allocated to customers"
      description="Record salary costs by customer"
      icon={Users}
    />
  );
};
