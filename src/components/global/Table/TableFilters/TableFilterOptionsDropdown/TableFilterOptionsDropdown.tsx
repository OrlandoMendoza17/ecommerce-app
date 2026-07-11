import { Plus } from "lucide-react";
import React from "react";
import { twMerge } from "tailwind-merge";

import { TableFilterOptionsDropdownProps as Props } from "./TableFilterOptionsDropdown.types";
import { getFilterDisplayLabel } from "@/components/global/Table/Table.helpers";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TableFilterOptionsDropdown = (props: Props) => {
  const { className, options, onSelect } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!options.length}>
        <Button
          className={twMerge("TableFilterOptionsDropdown", className)}
          variant="ghost"
        >
          <Plus className="size-4" /> Añadir filtro
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map(option => {
          const { label } = option;
          return (
            <DropdownMenuItem key={label} onSelect={() => onSelect(option)}>
              {getFilterDisplayLabel(option)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableFilterOptionsDropdown;
