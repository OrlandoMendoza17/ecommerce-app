"use client";
import { twMerge } from "tailwind-merge";

import TableRowLinkAction from "../TableRowLinkAction/TableRowLinkAction";
import { TableRowEditActionProps as Props } from "./TableRowEditAction.types";
import { Pencil } from "lucide-react";

const TableRowEditAction = (props: Props) => {
  const { className, href, title = "Edit item" } = props;

  return (
    <TableRowLinkAction
      href={href}
      icon={<Pencil className="h-4 w-4" />}
      title={title}
      className={twMerge("TableRowEditAction", className)}
    />
  );
};

export default TableRowEditAction;
