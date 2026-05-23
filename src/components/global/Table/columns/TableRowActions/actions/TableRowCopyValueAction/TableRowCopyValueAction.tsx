import { PopoverArrow } from "@radix-ui/react-popover";
import { useState } from "react";
import { flushSync } from "react-dom";
import { twMerge } from "tailwind-merge";
import { MdOutlineContentCopy } from "react-icons/md";

import { TableRowCopyValueActionProps as Props } from "./TableRowCopyValueAction.types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TableRowCopyValueAction = (props: Props) => {
  const { className, entity, value, name = "" } = props;
  const [opened, setOpened] = useState(false);

  const copyHandler = async (e: Event) => {
    e.preventDefault();
    await navigator.clipboard.writeText(value);
    setOpened(true);
    setTimeout(() => {
      flushSync(() => setOpened(false));
      document.getElementById("close-dropdown")?.click();
    }, 500);
  };

  return (
    <DropdownMenuItem
      className={twMerge("TableRowCopyValueAction", className)}
      onSelect={copyHandler}
    >
      <Popover open={opened}>
        <PopoverTrigger asChild>
          <span className="flex items-center gap-2 cursor-pointer">
            <MdOutlineContentCopy className="h-4 w-4" />
            <span>
              {/* Copiar {name} de {entity} */}
              Copiar {name}
            </span>
          </span>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-max px-4 py-2">
          Copied!
          <PopoverArrow height={8} width={10} />
        </PopoverContent>
      </Popover>
    </DropdownMenuItem>
  );
};

export default TableRowCopyValueAction;
