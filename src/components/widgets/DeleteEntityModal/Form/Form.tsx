import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { getSchema } from "./Form.helpers";
import { FormProps as Props, Schema } from "./Form.types";
import FormInput from "@/components/form/FormInput/FormInput";
import useScrollToError from "@/hooks/useScrollToError";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";

const DeleteEntityForm = (props: Props) => {
  const { className, id, name, formName, entity } = props;
  const { mutation, onDeleteSuccess } = props;
  const { toast, errorToast } = useToast();
  const { mutateAsync } = mutation.useMutation({ onError: errorToast });
  const instruction = `"Eliminar ${name}"`;
  const form = useForm<Schema>({
    resolver: zodResolver(getSchema(name)),
    defaultValues: { name: "" }
  });
  useScrollToError(form.formState.errors);

  const submitHandler: SubmitHandler<Schema> = async values => {
    await mutateAsync({ id } as any);
    const title = "¡Éxito!";
    const description = `${entity} eliminado exitosamente`;
    toast({ title, description, variant: "success" });
    onDeleteSuccess();
    document.getElementById("close-dialog")?.click();
  };

  return (
    <Form {...form}>
      <form
        noValidate
        id={`form-${formName}`}
        className={twMerge("DeletePointForm", className)}
        onSubmit={form.handleSubmit(submitHandler, e => console.error(e))}
      >
        <FormInput
          control={form.control}
          label={`Confirma escribiendo ${instruction}`}
          placeholder={`Escribe ${instruction}`}
          name="name"
        />
      </form>
    </Form>
  );
};

export default DeleteEntityForm;
