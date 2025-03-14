import type { ColumnMeta } from '@tanstack/react-table'

export function PropertyFilterSubject<TData>({
  meta,
}: {
  meta: ColumnMeta<TData, string>
}) {
  const hasIcon = !!meta?.icon
  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
      {hasIcon && <meta.icon className="size-4 stroke-[2.25px]" />}
      <span>{meta.displayName}</span>
    </span>
  )
}
