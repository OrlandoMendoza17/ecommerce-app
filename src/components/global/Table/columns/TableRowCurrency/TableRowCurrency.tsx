import { TableRowCurrencyProps as Props } from "./TableRowCurrency.types"
import { formatCurrency } from "@/lib/formatters/currency";

const TableRowCurrency = ({ amount, currency }: Props) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">
        {formatCurrency(amount, currency ?? "USD")}
      </span>
    </div>
  )
}

export default TableRowCurrency
