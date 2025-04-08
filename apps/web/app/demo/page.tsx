'use client'

import dynamic from 'next/dynamic'

const DataTableDemo = dynamic(
  () => import('@/components/data-table-filter-demo/v2/demo'),
  { ssr: false },
)
// import DataTableDemo from '@/components/data-table-filter/v2/demo'

export default function DemoPage() {
  return (
    <div className="p-16">
      <DataTableDemo />
    </div>
  )
}
