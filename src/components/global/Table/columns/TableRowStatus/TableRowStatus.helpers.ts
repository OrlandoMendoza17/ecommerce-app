// TableRowStatus helper functions and data
import { VariantTypes } from "@/types/common.types";

export const getVariant = (status: string): VariantTypes => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "FAILED":
      return "destructive";
    case "PENDING":
    case "NOT_FULFILLED":
      return "inactive";
    case "PROCESSING":
      return "default";
    default:
      return "outline";
  }
};
