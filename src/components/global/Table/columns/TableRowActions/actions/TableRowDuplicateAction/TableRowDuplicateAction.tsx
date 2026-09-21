"use client";

import React, { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableRowDuplicateActionProps as Props } from "./TableRowDuplicateAction.types";

const TableRowDuplicateAction = (props: Props) => {
  const { className, title = "Duplicar", onDuplicate, disabled, icon } = props;
  const [loading, setLoading] = useState(false);

  const handleSelect = async (e: Event) => {
    e.preventDefault();
    if (loading || disabled || !onDuplicate) return;

    try {
      setLoading(true);
      await onDuplicate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      onSelect={handleSelect}
      disabled={disabled || loading}
      className={twMerge(
        "TableRowDuplicateAction cursor-pointer flex items-center gap-2",
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        icon ?? <Copy className="size-4" />
      )}
      <span>{loading ? "Duplicando..." : title}</span>
    </DropdownMenuItem>
  );
};

export default TableRowDuplicateAction;
