import Example1 from '@/components/demo/ex1'
import { default as DataTableDynamic } from './components/demo/dynamic/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

export default function App() {
  return (
    <div className="p-16">
      <Tabs defaultValue="dynamic">
        <TabsList className="w-[300px]">
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="static">Static</TabsTrigger>
          <TabsTrigger value="ex1">Example 1</TabsTrigger>
        </TabsList>
        <TabsContent value="dynamic">
          <DataTableDynamic />
        </TabsContent>
        <TabsContent value="ex1">
          <Example1 />
        </TabsContent>
      </Tabs>
    </div>
  )
}
