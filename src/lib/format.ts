
export const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

export const formatCurrency = (value: number, currency: string = 'VND'): string => {
  return `${value.toLocaleString()} ${currency}`
}
