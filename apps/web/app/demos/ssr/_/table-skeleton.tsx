import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface TableSkeletonProps {
  numCols: number
  numRows: number
}

export function TableSkeleton({ numRows, numCols }: TableSkeletonProps) {
  const rows = Array.from(Array(numRows).keys())
  const cols = Array.from(Array(numCols).keys())

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <TableHead key={index}>
                <Skeleton className="h-[20px] w-[75px]" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <TableRow key={index}>
              {cols.map((_, index2) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <TableCell key={index2}>
                  <Skeleton className="h-[30px] w-[140px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
