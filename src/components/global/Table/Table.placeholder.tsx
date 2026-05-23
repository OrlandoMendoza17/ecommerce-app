import { TableSkeletonProps } from "./Table.types";
import { Skeleton } from "@/components/ui/skeleton";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table as TableRoot, TableBody, TableCell } from "@/components/ui/table";

const TableSkeleton = (props: TableSkeletonProps) => {
  const { columns, rows, className, ref } = props;
  return (
    <div className={className} ref={ref}>
      <TableRoot>
        <TableHeader>
          <TableRow className="border-border/50">
            {Array.from({ length: columns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="border-border/50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableRoot>
    </div>
  );
};

export default TableSkeleton;
