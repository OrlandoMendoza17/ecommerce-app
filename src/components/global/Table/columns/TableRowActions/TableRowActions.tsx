import { MoreHorizontal } from "lucide-react";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

import { TableRowActionsProps as Props } from "./TableRowActions.types";
import TableRowClickAction from "./actions/TableRowClickAction/TableRowClickAction";
import TableRowCopyIdAction from "./actions/TableRowCopyIdAction/TableRowCopyIdAction";
import TableRowCopyValueAction from "./actions/TableRowCopyValueAction/TableRowCopyValueAction";
import TableRowDeleteAction from "./actions/TableRowDeleteAction/TableRowDeleteAction";
import TableRowEditAction from "./actions/TableRowEditAction/TableRowEditAction";
import TableRowLinkAction from "./actions/TableRowLinkAction/TableRowLinkAction";
import { Button } from "@/components/ui/button";
import { DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";

const TableRowActions = (props: Props) => {
  const { className, children, title = "Acciones" } = props;
  const [opened, setOpened] = useState(false);

  return (
    <DropdownMenu open={opened} onOpenChange={other => setOpened(other)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={twMerge("TableRowActions w-full", className)}
      >
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
      {opened ? (
        <Button
          variant="ghost"
          className="invisible absolute -z-10 size-8 p-0"
          id="close-dropdown"
          onClick={() => setOpened(false)}
        >
          <span className="sr-only">Cerrar menú</span>
        </Button>
      ) : null}
    </DropdownMenu>
  );
};

TableRowActions.CopyId = TableRowCopyIdAction;
TableRowActions.CopyValue = TableRowCopyValueAction;
TableRowActions.Edit = TableRowEditAction;
TableRowActions.Delete = TableRowDeleteAction;
TableRowActions.Click = TableRowClickAction;
TableRowActions.Link = TableRowLinkAction;

export default TableRowActions;
