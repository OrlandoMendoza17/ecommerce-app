import { Database } from "./src/lib/database.types";

declare global {
  type Database = import("./src/lib/database.types").Database;
  type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
}