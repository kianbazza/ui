import { DataTable } from './_/data-table'

export default function SSRPage() {
  return (
    <div className="p-16 flex flex-col gap-8">
      <h1>SSR Page</h1>
      <DataTable />
    </div>
  )
}
