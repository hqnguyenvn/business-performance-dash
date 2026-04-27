import { PageHeader } from "@/components/PageHeader";
import { Target } from "lucide-react";
import { PlansTable } from "@/components/plans/PlansTable";

export default function Plans() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="Annual Plan"
        description="Nhập kế hoạch BMM và doanh thu theo (năm, tháng, công ty)"
        icon={Target}
      />
      <main className="flex-1 p-6">
        <PlansTable />
      </main>
    </div>
  );
}
