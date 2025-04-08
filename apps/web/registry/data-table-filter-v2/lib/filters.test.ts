import {
  type DataTableFilterConfig,
  createColumnConfigHelper,
} from '@/registry/data-table-filter-v2/lib/filters'
import { CircleDotDashedIcon } from 'lucide-react'

type Issue = {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in progress' | 'done'
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
  foo: {
    bar: string
  }
}

const helper = createColumnConfigHelper<Issue>()

const columns = [
  helper.accessor((row) => row.description, {
    id: 'description',
    displayName: 'Description',
    icon: CircleDotDashedIcon,
    type: 'text',
  }),
  helper.accessor((row) => row.status, {
    id: 'status',
    displayName: 'Status',
    icon: CircleDotDashedIcon,
    type: 'option',
    options: [
      { label: 'Todo', value: 'todo' },
      { label: 'In Progress', value: 'in progress' },
      { label: 'Done', value: 'done' },
    ],
  }),
]

const config = {
  columns,
} satisfies DataTableFilterConfig<Issue>
