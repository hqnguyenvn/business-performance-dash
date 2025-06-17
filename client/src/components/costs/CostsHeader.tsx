
import { PageHeader } from "@/components/PageHeader";
import { Receipt } from "lucide-react";

export const CostsHeader = () => {
  return (
    <PageHeader
      title="Cost Management"
      description="Record costs by year and month"
      icon={Receipt}
    />
  );
};
