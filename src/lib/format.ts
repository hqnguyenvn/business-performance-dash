export const formatNumber = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0'
  }
  // Round to remove decimal places and format with commas
  return Math.round(value).toLocaleString('en-US')
}

// Định dạng số có tối đa 2 số lẻ (có phân cách hàng nghìn)
export const formatNumberWithDecimals = (value: number, decimals: number = 2): string => {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export const parseFormattedNumber = (value: string): number => {
  if (!value || value === '') return 0
  // Remove all commas and parse as float
  const cleanValue = value.replace(/,/g, '')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

export const formatCurrency = (value: number, currency: string = 'VND'): string => {
  return `${formatNumber(value)} ${currency}`
}
