"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatCardProps as Props } from "./StatCard.types";
import { STAT_CARD_ICONS } from "./StatCard.config";
import { cn } from "@/lib/utils";

const StatCard = (props: Props) => {
  const { label, activeCount, pendingCount, iconKey } = props;
  const { variant = "default", href, isLoading } = props;

  const iconConfig = STAT_CARD_ICONS[iconKey];
  const Icon = iconConfig.icon;
  const hasPending = pendingCount !== undefined && pendingCount > 0;

  // Skeleton loading
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Determinar estilos según variante
  const getBorderColor = () => {
    if (!hasPending) return "";
    switch (variant) {
      case "warning":
        return "border-l-orange-500";
      case "info":
        return "border-l-blue-500";
      case "success":
        return "border-l-green-500";
      case "danger":
        return "border-l-red-500";
      default:
        return "border-l-purple-500";
    }
  };

  const getPendingColor = () => {
    switch (variant) {
      case "warning":
        return "text-orange-600";
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-purple-600";
    }
  };

  const cardContent = (
    <Card
      className={cn(
        "transition-all",
        href && "hover:shadow-md cursor-pointer",
        hasPending && "border-l-4",
        getBorderColor(),
        "p-2 px-3 sm:p-4 md:p-6 gap-4 md:gap-6"
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{activeCount}</p>
              {hasPending && (
                <p className={cn("text-xl font-semibold", getPendingColor())}>
                  +{pendingCount}
                </p>
              )}
            </div>
          </div>
          <div className={cn(iconConfig.bgColor, "p-3 rounded-full")}>
            <Icon className={cn("h-6 w-6", iconConfig.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
};

export default StatCard;
