// TableRowDeleteAction types and interfaces
import { trpc } from "@/config/trpc.config";
import { IconType } from "react-icons/lib";

// Component Props
export interface TableRowDeleteActionProps {
  className?: string;
  title?: string;
  entity: string;
  name: string;
  id: string;
  mutation: DeleteMutations;
  onDeleteSuccess: () => void;
  disabled?: boolean;
  Icon?: IconType;
}

type FilterStartingWith<
  Set,
  Needle extends string
// eslint-disable-next-line @typescript-eslint/no-unused-vars
> = Set extends `${Needle}${infer _X}` ? Set : never;

type TRPC = typeof trpc;
type A = Exclude<
  Extract<keyof TRPC, string>,
  | "useContext"
  | "useQueries"
  | "Provider"
  | "createClient"
  | "useDehydratedState"
>;
type B = { [K in A]: FilterStartingWith<keyof TRPC[K], "delete"> };

type D = { [K in keyof B]: TRPC[K][B[K]] };

export type DeleteMutations = D[keyof B];
