import { default as DataTableDynamic } from './components/demo/dynamic/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

export default function App() {
  return (
    <div className="p-16">
      <Tabs defaultValue="dynamic">
        <TabsList className="w-[300px]">
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="static">Static</TabsTrigger>
        </TabsList>
        <TabsContent value="dynamic">
          <DataTableDynamic />
        </TabsContent>
      </Tabs>
    </div>
  )
}
