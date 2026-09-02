"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const effective = hovered > 0 ? hovered : value;
  const iconSize = SIZE_MAP[size];

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={() => !readOnly && setHovered(0)}
      aria-label={`Calificación: ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= effective;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            className={cn(
              "transition-transform",
              !readOnly && "cursor-pointer hover:scale-110",
              readOnly && "cursor-default"
            )}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onClick={() => !readOnly && onChange?.(star)}
          >
            <Star
              className={cn(
                iconSize,
                "transition-colors",
                isFilled
                  ? "fill-primary text-primary"
                  : "fill-transparent text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
