"use client";

import { DialogPortal, Content } from "@radix-ui/react-dialog";
import { Close } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

import { DialogContentProps as Props } from "./DialogContent.types";
import { DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Adds the ability to add custom close functions to the x button
const DialogContent = (props: Props) => {
  const { ref, className, children, hideCloseButton, onClose, ...rest } = props;
  const { onCloseClick, closeId, ...rest2 } = rest;

  return (
    <DialogPortal>
      <DialogOverlay />
      <Content
        onEscapeKeyDown={onClose}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
          className
        )}
        ref={ref}
        {...rest2}
      >
        {children}
        {!hideCloseButton ? (
          <Close
            onClick={onCloseClick ?? onClose}
            id={closeId ?? "close-dialog"}
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Close>
        ) : null}
      </Content>
    </DialogPortal>
  );
};

DialogContent.displayName = Content.displayName;

export default DialogContent;
