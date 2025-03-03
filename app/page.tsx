import DataTableDemo from '@/components/data-table-filter/demo'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Page() {
  return (
    <div className="p-8 w-full">
      <ThemeToggle />
      <DataTableDemo />
    </div>
  )
}
