import Example1 from '@/components/demo/ex1'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { FiltersState } from './components/data-table-filter/core/types'
import { default as DataTableDynamic } from './components/demo/dynamic/data-table'
import { IssuesTable } from './components/demo/ssf-tst-query/issues-table'
import QueryClientProvider from './components/demo/ssf-tst-query/query-client-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

const filtersSchema = z.custom<FiltersState>()

export default function App() {
  const [filters, setFilters] = useQueryState<FiltersState>(
    'filters',
    parseAsJson(filtersSchema.parse).withDefault([]),
  )

  return (
    <div className="p-16">
      <Tabs defaultValue="dynamic">
        <TabsList className="w-[350px]">
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="static">Static</TabsTrigger>
          <TabsTrigger value="ex1">Example 1</TabsTrigger>
          <TabsTrigger value="ex2">Example 2</TabsTrigger>
        </TabsList>
        <TabsContent value="dynamic">
          <DataTableDynamic />
        </TabsContent>
        <TabsContent value="ex1">
          <Example1 />
        </TabsContent>
        <TabsContent value="ex2">
          <QueryClientProvider>
            <IssuesTable state={{ filters, setFilters }} />
          </QueryClientProvider>
        </TabsContent>
      </Tabs>
    </div>
  )
}
