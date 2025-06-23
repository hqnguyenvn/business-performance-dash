import React from "react";
import ExchangeRateTableRow from "./ExchangeRateTableRow";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRateDisplay {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

interface ExchangeRateTableBodyProps {
  data: ExchangeRateDisplay[];
  setEditingCell: React.Dispatch<React.SetStateAction<{id: string, field: keyof ExchangeRateDisplay | null} | null>>;
  editingCell: {id: string, field: keyof ExchangeRateDisplay | null} | null;
  onEditCell: (id: string, field: keyof ExchangeRateDisplay) => void;
  onBlurCell: () => void;
  saveCell: (id: string, field: keyof ExchangeRateDisplay, value: string | number) => void;
  deleteRow: (id: string) => void;
  addRowBelow: (id: string) => void;
  currencies: MasterData[];
  MONTHS: string[];
}

const ExchangeRateTableBody: React.FC<ExchangeRateTableBodyProps> = ({
  data,
  setEditingCell,
  editingCell,
  onEditCell,
  onBlurCell,
  saveCell,
  deleteRow,
  addRowBelow,
  currencies,
  MONTHS,
}) => {
  return (
    <tbody>
      {data.map((rate, idx) => (
        <ExchangeRateTableRow
          key={rate.id}
          rate={rate}
          idx={idx}
          editingCell={editingCell}
          onEditCell={onEditCell}
          onBlurCell={onBlurCell}
          saveCell={saveCell}
          deleteRow={deleteRow}
          addRowBelow={addRowBelow}
          currencies={currencies}
          MONTHS={MONTHS}
          className="h-[40px]"
        />
      ))}
    </tbody>
  );
};

export default ExchangeRateTableBody;