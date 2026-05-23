import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

import { TableRowLinkActionProps as Props } from "./TableRowLinkAction.types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const TableRowLinkAction = (props: Props) => {
  const { className, href, title, target, icon, disabled } = props;

  const content = (
    <>
      {icon && <span>{icon}</span>}
      {title}
    </>
  );

  if (disabled) {
    return (
      <DropdownMenuItem className={twMerge("TableRowLinkAction", className)} disabled>
        {content}
      </DropdownMenuItem>
    );
  }

  return (
    <Link href={href} target={target}>
      <DropdownMenuItem className={twMerge("TableRowLinkAction", className)}>
        {content}
      </DropdownMenuItem>
    </Link>
  );
};

export default TableRowLinkAction;
