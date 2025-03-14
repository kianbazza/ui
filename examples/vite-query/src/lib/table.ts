import type { Table } from '@tanstack/react-table'

export function getColumn<TData>(table: Table<TData>, id: string) {
  const column = table.getColumn(id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

export function getColumnMeta<TData>(table: Table<TData>, id: string) {
  const column = getColumn(table, id)

  if (!column.columnDef.meta) {
    throw new Error(`Column meta not found for column ${id}`)
  }

  return column.columnDef.meta
}
