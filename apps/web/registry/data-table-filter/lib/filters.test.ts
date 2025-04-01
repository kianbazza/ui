// @ts-nocheck
import { defineMeta } from '@/registry/data-table-filter/lib/filters'
import { createColumnHelper } from '@tanstack/react-table'
import { PersonStandingIcon } from 'lucide-react'

type Person = {
  name: {
    first: string
    middle?: string
    last: string
  }
  fullName: string
  age: number
  gender: 'male' | 'female'
  birthday: Date
  email: string
  salary?: number
  bio: string
}

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor('fullName', {
    id: 'fullName1',
    // Uses accessorKey
    meta: defineMeta('fullName', {
      type: 'option',
      icon: PersonStandingIcon,
      displayName: 'Full name',
      transformOptionFn(value) {
        return { value, label: value }
      },
    }),
  }),
  columnHelper.accessor('fullName', {
    id: 'fullName2',
    // Uses accessorFn
    meta: defineMeta((row) => row.fullName, {
      type: 'option',
      icon: PersonStandingIcon,
      displayName: 'Full name',
      transformOptionFn(value) {
        return { value, label: value }
      },
    }),
  }),
]
