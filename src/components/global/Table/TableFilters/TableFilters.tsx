import { X, Filter } from "lucide-react";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

import { TableFiltersProps as Props } from "./TableFilters.types";
import TableFiltersForm from "./TableFiltersForm/TableFiltersForm";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TableFilters = (props: Props) => {
  const { className, values } = props;
  const [open, setOpen] = useState(false);
  const hasAppliedFilters = Object.keys(values.filters).length > 0;
  const [applying, setApplying] = useState(hasAppliedFilters);
  const appliedCount = Object.keys(values.filters).length;
  const ruleText = appliedCount === 1 ? "condición" : "condiciones";
  const filteredTitle = `Filtrado por ${appliedCount} ${ruleText}`;
  const title = appliedCount ? filteredTitle : "Filtrar";

  const openChangeHandler = (open: boolean) => {
    setOpen(open);
    if (!open) setApplying(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={openChangeHandler}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
        // className={twMerge(
        //   "TableFilters flex bg-background border border-border h-auto items-center gap-1 rounded! border-none! px-2 pt-1.5 pb-1 text-sm",
        //   open ? "bg-accent text-accent-foreground" : "",
        //   appliedCount
        //     ? "text-primary border-primary hover:bg-primary/20 hover:text-primary"
        //     : "",
        //   className
        // )}
        >
          <Filter
            className={twMerge(
              "size-4",
              appliedCount ? "stroke-primary" : "stroke-muted-foreground"
            )}
          />{" "}
          <span className="text-nowrap">{title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96 p-2">
        <div
          className="invisible absolute top-2 right-2 cursor-pointer"
          onClick={() => setOpen(false)}
          id="close-dropdown"
        >
          <X className="size-4" />
        </div>
        {!applying ? (
          <>
            <DropdownMenuLabel className="py-0! text-sm">
              No se han aplicado filtros aún
            </DropdownMenuLabel>
            <DropdownMenuLabel className="text-muted-foreground pt-0 pb-2 text-xs font-normal">
              Selecciona una opción para filtrar la tabla
            </DropdownMenuLabel>
          </>
        ) : null}
        <TableFiltersForm values={values} onApplying={setApplying} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableFilters;
