
import React from "react";

const ExchangeRateTableHead: React.FC = () => (
  <thead>
    <tr className="bg-gray-50">
      <th className="border border-gray-300 p-2 text-left font-medium w-24">Year</th>
      <th className="border border-gray-300 p-2 text-left font-medium w-24">Month</th>
      <th className="border border-gray-300 p-2 text-left font-medium w-40">Currency Code</th>
      <th className="border border-gray-300 p-2 text-right font-medium w-40">Exchange Rate</th>
      <th className="border border-gray-300 p-2 text-center font-medium w-32">Actions</th>
    </tr>
  </thead>
);

export default ExchangeRateTableHead;
