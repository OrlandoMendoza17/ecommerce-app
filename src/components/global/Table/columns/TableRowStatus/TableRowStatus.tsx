import { twMerge } from "tailwind-merge";

import { getVariant } from "./TableRowStatus.helpers";
import { TableRowStatusProps as Props } from "./TableRowStatus.types";
import { Badge } from "@/components/ui/badge";

const TableRowStatus = (props: Props) => {
  const { className, status, children, variant } = props;

  return (
    <div className="flex max-w-16 justify-center">
      <Badge
        className={twMerge(
          "TableRowStatus px-2 text-[10px] leading-tight tracking-tighter",
          className
        )}
        variant={variant ?? getVariant(status) as any}
      >
        {children ?? status}
      </Badge>
    </div>
  );
};

export default TableRowStatus;
