
import React from "react";
import { formatNumber } from "@/lib/format";

// Định nghĩa props
interface FormattedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  uniqueKey?: string | number; // thêm prop này để đánh dấu row/dòng (vd: row id hoặc index)
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder,
  min,
  step,
  uniqueKey,
}) => {
  // Lưu lại key hiện tại đang edit, để chỉ reset khi đổi row
  const lastKeyRef = React.useRef<string | number | undefined>(uniqueKey);

  // rawValue chỉ reset khi chuyển sang một key (row) khác
  const [rawValue, setRawValue] = React.useState<string>(
    value === 0 ? "" : value.toString()
  );

  // Khi uniqueKey (là id dòng hoặc index) đổi, reset value input về value prop
  React.useEffect(() => {
    if (lastKeyRef.current !== uniqueKey) {
      setRawValue(value === 0 ? "" : value.toString());
      lastKeyRef.current = uniqueKey;
    }
    // eslint-disable-next-line
  }, [uniqueKey]);

  // Khi value đổi từ ngoài (nhưng vẫn cùng dòng), chỉ update nếu value khác hoàn toàn với hiện tại và rawValue bị trống
  React.useEffect(() => {
    if (
      rawValue === "" &&
      typeof value === "number" &&
      value !== 0
    ) {
      setRawValue(value.toString());
    }
    // eslint-disable-next-line
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    // Cho nhập chuỗi rỗng (clear input)
    if (v === "") {
      setRawValue("");
      onChange(0);
      return;
    }
    // Check nếu đúng định dạng số, cho phép tối đa 2 chữ số thập phân
    if (
      /^\d{1,3}(,\d{3})*(\.\d{0,2})?$|^\d*(\.\d{0,2})?$/.test(
        v.replace(/,/g, "")
      )
    ) {
      setRawValue(v);
      // Chuyển thành số
      const num = parseFloat(v.replace(/,/g, ""));
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  // Khi blur thì format lại số (gắn dấu phẩy)
  const handleBlur = () => {
    if (rawValue !== "") {
      const num = parseFloat(rawValue.replace(/,/g, ""));
      setRawValue(isNaN(num) ? "" : formatNumber(num));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`h-8 text-right px-2 border rounded ${className}`}
      value={rawValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      step={step}
    />
  );
};
