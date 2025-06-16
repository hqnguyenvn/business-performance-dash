
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
    
    // Cho phép input rỗng
    if (v === "") {
      setRawValue("");
      return;
    }
    
    // Nếu cho phép decimal, kiểm tra pattern khác
    if (allowDecimals) {
      // Cho phép: số nguyên, số có dấu chấm, số có dấu chấm và các chữ số sau
      // Ví dụ: 1, 1., 1.2, 1.23
      const decimalPattern = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
      if (decimalPattern.test(v)) {
        setRawValue(v);
        return;
      }
    } else {
      // Chỉ cho phép số nguyên
      if (/^\d*$/.test(v)) {
        setRawValue(v);
        return;
      }
    }
  };

  // Khi BLUR: luôn gọi onBlur để lưu thực sự lên server
  const handleBlur = () => {
    if (rawValue !== "") {
      const num = parseFloat(rawValue);
      if (!isNaN(num)) {
        // Format lại display value
        if (allowDecimals) {
          setRawValue(formatNumberWithDecimals(num, decimals));
        } else {
          setRawValue(Math.round(num).toLocaleString('en-US'));
        }
        
        if (onBlur) {
          onBlur(num);
        }
        if (onChange) {
          onChange(num);
        }
      } else {
        setRawValue("");
        if (onBlur) {
          onBlur(0);
        }
        if (onChange) {
          onChange(0);
        }
      }
    } else {
      if (onBlur) {
        onBlur(0);
      }
      if (onChange) {
        onChange(0);
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
