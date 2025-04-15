import { TableFilterSkeleton, TableSkeleton } from './table-skeleton'

export function IssuesTableFallback() {
  return (
    <div className="w-full col-span-2">
      <div className="flex items-center pb-4 gap-2">
        <TableFilterSkeleton />
      </div>
      <div className="w-full col-span-2">
        <TableSkeleton numCols={8} numRows={10} />
      </div>
    </div>
  )
}
