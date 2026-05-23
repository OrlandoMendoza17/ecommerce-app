import { DialogClose } from "@radix-ui/react-dialog";
import { useIsMutating } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { DeleteEntityModalProps as Props } from "./DeleteEntityModal.types";
import Form from "./Form/Form";
import DialogContent from "@/components/widgets/DialogContent/DialogContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DeleteEntityModal = (props: Props) => {
  const { className, children, entity, ...rest } = props;
  const formName = `delete-${entity}`;
  const mutating = useIsMutating();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={twMerge("DeleteEntityModal sm:max-w-[465px]", className)}>
        <DialogHeader>
          <DialogTitle className="leading-6">
            Estás a punto de eliminar un &ldquo;{entity}&rdquo; permanentemente
          </DialogTitle>
          <DialogDescription>
            Eliminar el <strong>{entity}</strong> causará que pierdas permanentemente todos los datos
            asociados
          </DialogDescription>
        </DialogHeader>
        <Form formName={formName} entity={entity} {...rest} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="submit"
            form={`form-${formName}`}
            variant="destructive"
            className="flex items-center gap-2"
            disabled={!!mutating}
          >
            <Trash width={16} />
            Eliminar permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEntityModal;
