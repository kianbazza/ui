import { issues } from './data'
import { columns } from './columns'
import { DataTable } from './data-table'

export default function Example1() {
  return <DataTable columns={columns} data={issues} />
}
