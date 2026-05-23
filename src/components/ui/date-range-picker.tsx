"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePickerProps {
  className?: string;
  initialDateFrom?: Date | string;
  initialDateTo?: Date | string;
  onUpdate?: (values: { range: DateRange }) => void;
  align?: "start" | "center" | "end";
  locale?: string;
  showCompare?: boolean;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function DateRangePicker({
  className,
  initialDateFrom,
  initialDateTo,
  onUpdate,
  align = "end",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const parseDate = (date: Date | string | undefined): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    return new Date(date);
  };

  const [range, setRange] = React.useState<DateRange>({
    from: parseDate(initialDateFrom),
    to: parseDate(initialDateTo),
  });

  const handleSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) return;

    setRange(selectedRange);

    if (selectedRange.from && selectedRange.to) {
      onUpdate?.({ range: selectedRange });
      setIsOpen(false);
    }
  };

  const displayText = React.useMemo(() => {
    if (!range.from) {
      return <span>Pick a date</span>;
    }

    if (!range.to) {
      return formatDate(range.from);
    }

    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  }, [range]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={range.from}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
