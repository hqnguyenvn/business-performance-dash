
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

interface MasterDataTableBodyProps {
  data: MasterData[];
  companies: MasterData[];
  customers: MasterData[];
  showCompanyColumn: boolean;
  showCustomerColumn: boolean;
  handleCellEdit: (id: string, field: keyof MasterData, value: string) => void;
  deleteItem: (id: string) => void;
}

const MasterDataTableBody: React.FC<MasterDataTableBodyProps> = ({
  data,
  companies,
  customers,
  showCompanyColumn,
  showCustomerColumn,
  handleCellEdit,
  deleteItem,
}) => {
  return (
    <>
      {data.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50">
          {showCompanyColumn && (
            <td className="border border-gray-300 p-1">
              <select
                className="border-0 p-1 h-8 w-full"
                value={item.company_id || ""}
                onChange={(e) => handleCellEdit(item.id, 'company_id', e.target.value)}
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </td>
          )}
          {showCustomerColumn && (
            <td className="border border-gray-300 p-1">
              <select
                className="border-0 p-1 h-8 w-full"
                value={item.customer_id || ""}
                onChange={(e) => handleCellEdit(item.id, 'customer_id', e.target.value)}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </td>
          )}
          <td className="border border-gray-300 p-1">
            <input
              className="border-0 p-1 h-8 w-full"
              value={item.code}
              onChange={(e) => handleCellEdit(item.id, 'code', e.target.value)}
            />
          </td>
          <td className="border border-gray-300 p-1">
            <input
              className="border-0 p-1 h-8 w-full"
              value={item.name}
              onChange={(e) => handleCellEdit(item.id, 'name', e.target.value)}
            />
          </td>
          <td className="border border-gray-300 p-1">
            <input
              className="border-0 p-1 h-8 w-full"
              value={item.description || ""}
              onChange={(e) => handleCellEdit(item.id, 'description', e.target.value)}
            />
          </td>
          <td className="border border-gray-300 p-2 text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this item? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteItem(item.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </td>
        </tr>
      ))}
    </>
  );
};

export default MasterDataTableBody;
