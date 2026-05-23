"use client";

import { twMerge } from "tailwind-merge";

import { TableRowClickActionProps as Props } from "./TableRowClickAction.types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const TableRowClickAction = (props: Props) => {
  const { className, onClick, title, icon } = props;

  return (
    <DropdownMenuItem
      className={twMerge("TableRowClickAction cursor-pointer", className)}
      onSelect={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </DropdownMenuItem>
  );
};

export default TableRowClickAction;
