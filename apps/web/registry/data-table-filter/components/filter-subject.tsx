import type { Column, ColumnDataType, EntityName } from '../core/types'

interface FilterSubjectProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  entityName?: EntityName
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
  entityName,
}: FilterSubjectProps<TData, TType>) {
  const hasIcon = !!column.icon
  const subject = column.type === 'boolean' ? entityName : column.displayName

  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
      {hasIcon && <column.icon className="size-4 stroke-[2.25px]" />}
      <span>{subject}</span>
    </span>
  )
}
