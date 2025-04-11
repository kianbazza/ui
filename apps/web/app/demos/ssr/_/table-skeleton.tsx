import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilterIcon } from 'lucide-react'

export interface TableSkeletonProps {
  numCols: number
  numRows: number
}

export function TableSkeleton({ numRows, numCols }: TableSkeletonProps) {
  const rows = Array.from(Array(numRows).keys())
  const cols = Array.from(Array(numCols).keys())

  return (
    <>
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
              <TableRow key={index} className="h-12">
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
      <div className="flex items-center justify-end py-4 space-x-2">
        <div className="flex-1 flex items-center gap-2">
          <Skeleton className="h-[20px] w-[200px]" />
          <Skeleton className="h-[20px] w-[150px]" />
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </>
  )
}

export function TableFilterSkeleton() {
  return (
    <div>
      <Button variant="outline" className="h-7" disabled>
        <FilterIcon className="size-4" />
        <span>Filter</span>
      </Button>
    </div>
  )
}
