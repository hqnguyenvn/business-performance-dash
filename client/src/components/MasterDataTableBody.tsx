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
  addRowBelow: (index: number) => void;
}

const MasterDataTableBody: React.FC<MasterDataTableBodyProps> = ({
  data,
  companies,
  customers,
  showCompanyColumn,
  showCustomerColumn,
  handleCellEdit,
  deleteItem,
  addRowBelow,
}) => {
  return (
    <>
      {data.map((item, idx) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 text-center font-medium w-12">{idx + 1}</td>
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
            <div className="flex items-center justify-center gap-1">
              {/* Nút + để thêm dòng mới bên dưới */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Insert new row below"
                onClick={() => addRowBelow(idx)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="12" x2="12" y1="5" y2="19" />
                  <line x1="5" x2="19" y1="12" y2="12" />
                </svg>
              </Button>
              {/* Nút xóa với màu đỏ nổi bật */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" x2="10" y1="11" y2="17"></line>
                      <line x1="14" x2="14" y1="11" y2="17"></line>
                    </svg>
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
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

export default MasterDataTableBody;
