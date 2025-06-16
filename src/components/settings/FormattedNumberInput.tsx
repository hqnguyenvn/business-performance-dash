
import React from "react";
import { formatNumberWithDecimals } from "@/lib/format";

interface FormattedNumberInputProps {
  value: number;
  onChange?: (value: number) => void;
  onBlur?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  uniqueKey?: string | number;
  allowDecimals?: boolean;
  decimals?: number;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  className = "",
  placeholder,
  min,
  step,
  uniqueKey,
  allowDecimals = false,
  decimals = 2,
}) => {
  const lastKeyRef = React.useRef<string | number | undefined>(uniqueKey);
  // rawValue là giá trị đang nhập, chỉ reset khi chuyển row
  const [rawValue, setRawValue] = React.useState<string>(
    value === 0 ? "" : value.toString()
  );

  // Reset input khi chuyển row/cell khác
  React.useEffect(() => {
    if (lastKeyRef.current !== uniqueKey) {
      setRawValue(value === 0 ? "" : value.toString());
      lastKeyRef.current = uniqueKey;
    }
    // eslint-disable-next-line
  }, [uniqueKey]);

  // Nếu props value bên ngoài khác biệt và rawValue đang rỗng, sync lại
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

  // Chỉ update local state khi gõ phím, KHÔNG gọi onChange lên trên!
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (v === "") {
      setRawValue("");
      onChange && onChange(0);
      return;
    }
    
    // Pattern cho phép số có hoặc không có phần thập phân
    const pattern = allowDecimals 
      ? new RegExp(`^\\d{1,3}(,\\d{3})*(\\.\\d{0,${decimals}})?$|^\\d*(\\.\\d{0,${decimals}})?$`)
      : /^\d{1,3}(,\d{3})*$|^\d*$/;
    
    if (pattern.test(v.replace(/,/g, ""))) {
      setRawValue(v);
      // Gọi onChange để container/parent state có thể biết value tạm (nếu cần) – mặc định KHÔNG lưu lên server
      if (onChange) {
        const num = parseFloat(v.replace(/,/g, ""));
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    }
  };

  // Khi BLUR: luôn gọi onBlur để lưu thực sự lên server
  const handleBlur = () => {
    if (rawValue !== "") {
      const num = parseFloat(rawValue.replace(/,/g, ""));
      if (allowDecimals) {
        setRawValue(isNaN(num) ? "" : formatNumberWithDecimals(num, decimals));
      } else {
        setRawValue(isNaN(num) ? "" : Math.round(num).toLocaleString('en-US'));
      }
      if (onBlur) {
        onBlur(isNaN(num) ? 0 : num);
      }
    } else {
      if (onBlur) {
        onBlur(0);
      }
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
