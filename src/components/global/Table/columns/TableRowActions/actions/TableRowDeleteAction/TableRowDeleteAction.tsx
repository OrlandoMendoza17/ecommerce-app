"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

import { TableRowDeleteActionProps as Props } from "./TableRowDeleteAction.types";
import DeleteEntityModal from "@/components/widgets/DeleteEntityModal/DeleteEntityModal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const TableRowDeleteAction = (props: Props) => {
  const { className, title = "Delete item", entity, disabled, Icon, ...rest } = props;
  const effectiveDisabled = disabled;

  return (
    <DeleteEntityModal {...rest} entity={entity}>
      <DropdownMenuItem
        onSelect={e => e.preventDefault()}
        className={twMerge("TableRowDeleteAction", className)}
        disabled={effectiveDisabled}
      >
        {Icon && <Icon className="size-4" />}
        {title}
      </DropdownMenuItem>
    </DeleteEntityModal>
  );
};

export default TableRowDeleteAction;
