import Example1 from '@/components/demo/ex1'
import { default as DataTableDynamic } from './components/demo/dynamic/data-table'
import { IssuesTable } from './components/demo/ssf-tst-query/issues-table'
import QueryClientProvider from './components/demo/ssf-tst-query/query-client-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

export default function App() {
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
            <IssuesTable />
          </QueryClientProvider>
        </TabsContent>
      </Tabs>
    </div>
  )
}
