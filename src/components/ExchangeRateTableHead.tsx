
import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExchangeRateTableHeadProps {
  addNewExchangeRate: () => void;
  // Add future filters here if needed
}

const ExchangeRateTableHead: React.FC<ExchangeRateTableHeadProps> = ({ addNewExchangeRate }) => (
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="border border-gray-300 p-2 text-left font-medium w-24">
        Year
      </TableHead>
      <TableHead className="border border-gray-300 p-2 text-left font-medium w-24">
        Month
      </TableHead>
      <TableHead className="border border-gray-300 p-2 text-left font-medium w-40">
        Currency Code
      </TableHead>
      <TableHead className="border border-gray-300 p-2 text-right font-medium w-40">
        Exchange Rate
      </TableHead>
      <TableHead className="border border-gray-300 p-2 text-center font-medium w-32">
        Actions
        <Button
          size="sm"
          variant="ghost"
          onClick={addNewExchangeRate}
          className="h-6 w-6 p-0 ml-1"
          title="Add New Exchange Rate"
        >
          <Plus className="h-4 w-4 text-blue-600" />
        </Button>
      </TableHead>
    </TableRow>
  </TableHeader>
);

export default ExchangeRateTableHead;
