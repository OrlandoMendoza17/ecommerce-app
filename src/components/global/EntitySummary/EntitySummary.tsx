"use client";

import dayjs from "dayjs";
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

import { getVariant } from "../Table/columns/TableRowStatus/TableRowStatus.helpers";
import { EntitySummaryProps as Props } from "./EntitySummary.types";
// import CONSTANTS from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";

// const { DATE_TIME_FORMAT, DATE_FORMAT } = CONSTANTS;

const DATE_FORMAT = "YYYY-MM-DD";
const DATE_TIME_FORMAT = "MMM DD YYYY - HH:mm:ss";

const EntitySummary = (props: Props) => {
  const { className, items } = props;
  const { toast } = useToast();

  const formatValue = (value: any, label: string, href: string | undefined) => {
    if (!value) return "N/A";
    if (href)
      return (
        <Link
          href={href}
          className="hover:text-primary transition-colors hover:underline"
        >
          {value}
        </Link>
      );
    if (value instanceof Date) {
      const date = dayjs(value);
      const hours = date.hour();
      const minutes = date.minute();
      const seconds = date.second();
      const withTime = hours || minutes || seconds;
      const format = withTime ? `${DATE_TIME_FORMAT}.SSS` : DATE_FORMAT;
      return dayjs(value).format(format);
    }
    if (label.toLowerCase().endsWith("id")) {
      const copyHandler = async () => {
        await navigator.clipboard.writeText(value);
        const description = `${label} copied to the clipboard`;
      };
      return (
        <span className="cursor-copy" onClick={copyHandler}>
          {value}
        </span>
      );
    }
    if (label === "Status")
      return (
        <Badge
          className={twMerge(
            "TableRowStatus px-2 text-[10px] leading-tight tracking-tighter",
            className
          )}
          variant={getVariant(value)}
        >
          {value}
        </Badge>
      );
    return value;
  };

  return (
    <div
      className={twMerge(
        "EntitySummary border-input grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4 rounded border p-6",
        className
      )}
    >
      {items.filter(Boolean).map(item => {
        const [label, value, type] = item as any;
        const formattedValue = formatValue(value, label, type);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="text-muted-foreground w-28 select-none">
              {label}:{" "}
            </span>
            <span
              className="text-foreground truncate text-sm"
              title={formattedValue}
            >
              {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default EntitySummary;
