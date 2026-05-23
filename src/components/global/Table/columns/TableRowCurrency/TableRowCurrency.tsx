import { TableRowCurrencyProps as Props } from "./TableRowCurrency.types"
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";

const TableRowCurrency = ({ amount, currency }: Props) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">
        {amount.toFixed(2)} {currency ? `${currency}` : ''}
      </span>
    </div>
  )
}

export default TableRowCurrency