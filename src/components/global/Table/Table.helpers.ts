import { QueryStatus } from "@tanstack/react-query";

export const getTableStatus = (
  countStatus: QueryStatus,
  queryStatus: QueryStatus
): QueryStatus => {
  if (countStatus === "error" || queryStatus === "error") return "error";
  if (countStatus === "pending" || queryStatus === "pending") return "pending";
  return "success";
};
