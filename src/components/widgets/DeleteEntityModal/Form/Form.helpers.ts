// Form helper functions and data
import { z } from "zod";

// import { vCommon } from "@/validations/common.validations";

const nameLaxValidation = () => {
  return z.string().trim().min(1, "Required").max(100);
};

export const getSchema = (name: string) => {
  const acceptedInput = `Eliminar ${name}`;
  return z
    .object({
      name: nameLaxValidation()
    })
    .refine(data => data.name === acceptedInput, {
      message: `El input no coincide con ${acceptedInput}`,
      path: ["name"]
    });
};
