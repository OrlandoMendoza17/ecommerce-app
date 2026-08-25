import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyWithSymbol } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

interface Props {
  currency: string;
  total: number;
  orderCount: number;
  href: string;
  isLoading?: boolean;
}

const CURRENCY_STYLES: Record<
  string,
  { iconBg: string; iconColor: string }
> = {
  USD: { iconBg: "bg-green-100", iconColor: "text-green-600" },
  EUR: { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  VES: { iconBg: "bg-orange-100", iconColor: "text-orange-600" },
};

const DEFAULT_STYLE = { iconBg: "bg-purple-100", iconColor: "text-purple-600" };

const RevenueStatCard = ({
  currency,
  total,
  orderCount,
  href,
  isLoading,
}: Props) => {
  if (isLoading) {
    return (
      <Card className="p-2 px-3 sm:p-4 md:p-6">
        <CardContent className="p-0">
          <div className="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const { iconBg, iconColor } =
    CURRENCY_STYLES[currency.toUpperCase()] ?? DEFAULT_STYLE;

  const currencyCode = currency.toUpperCase();

  return (
    <Link href={href}>
      <Card
        className={cn(
          "transition-all hover:shadow-md cursor-pointer",
          "p-2 px-3 sm:p-4 md:p-6 gap-4 md:gap-6"
        )}
      >
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos {currencyCode}
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrencyWithSymbol(total, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {orderCount} {orderCount === 1 ? "pedido" : "pedidos"}
              </p>
            </div>
            <div className={cn(iconBg, "p-3 rounded-full shrink-0")}>
              <TrendingUp className={cn("h-6 w-6", iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RevenueStatCard;
