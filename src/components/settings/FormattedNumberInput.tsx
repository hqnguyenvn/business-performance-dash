
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
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder,
  min,
  step,
}) => {
  const [rawValue, setRawValue] = React.useState<string>(value === 0 ? "" : value.toString());
  const ref = React.useRef<HTMLInputElement>(null);

  // Cập nhật lại rawValue khi value từ ngoài thay đổi (dùng effect để sync giá trị ban đầu/props đổi row)
  React.useEffect(() => {
    setRawValue(value === 0 ? "" : value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ cho phép chuỗi dạng số, dấu chấm/dấu phẩy
    let v = e.target.value;
    // Cho nhập chuỗi rỗng (clear input)
    if (v === "") {
      setRawValue("");
      onChange(0);
      return;
    }
    // Check nếu đúng định dạng số
    // Cho phép tối đa 2 chữ số thập phân
    if (/^\d{1,3}(,\d{3})*(\.\d{0,2})?$|^\d*(\.\d{0,2})?$/.test(v.replace(/,/g, ""))) {
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
      ref={ref}
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
