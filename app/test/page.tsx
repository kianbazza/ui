'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CheckIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function PopoverDemo({
  originAware = false,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopoverContent> &
  React.ComponentProps<typeof Popover> & { originAware?: boolean }) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {props.side}-{props.align}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-80',
          originAware && 'origin-(--radix-popover-content-transform-origin)',
        )}
        {...props}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type AlignOptions = 'start' | 'center' | 'end'
type SideOptions = 'top' | 'bottom' | 'left' | 'right'

type Item = {
  align: AlignOptions
  side: SideOptions
}

// Define arrays of all possible values
const alignValues: AlignOptions[] = ['start', 'center', 'end']
const sideValues: SideOptions[] = ['top', 'bottom', 'left', 'right']

// Generate all combinations
const allCombinations: Item[] = sideValues.flatMap((side) =>
  alignValues.map((align) => ({ side, align })),
)

// Optional: Log the result to verify
console.log(allCombinations)

export default function Page() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setInterval(() => {
      setOpen((open) => !open)
    }, 1000)
  }, [])

  return (
    <div className="p-12 flex items-center gap-72">
      <div className="flex flex-col gap-4">
        <h1 className="font-medium flex items-center gap-2">
          <XIcon className="text-red-500 size-8" />
          Not origin-aware
        </h1>
        <PopoverDemo
          align="start"
          side="bottom"
          open={open}
          onOpenChange={setOpen}
        />
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="font-medium flex items-center gap-2">
          <CheckIcon className="text-green-500 size-8" />
          Origin-aware
        </h1>

        <PopoverDemo
          align="start"
          side="bottom"
          originAware
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </div>
  )
}

// export default function Page() {
//   console.log(allCombinations)
//   return (
//     <div className="p-12 h-[200vh] flex flex-col items-center gap-12">
//       <section className="flex flex-col h-screen justify-center">
//         <h1 className="font-medium text-xl tracking-tight mb-8 flex items-center gap-2">
//           <XIcon className="text-red-500 size-8" />
//           Without origin-aware animations
//         </h1>
//         <div className="grid grid-cols-4 gap-x-4 gap-y-12 items-center text-sm">
//           {allCombinations.map(({ side, align }, index) => (
//             <>
//               {index % 3 === 0 && (
//                 <pre key={side} className="font-medium mr-4">
//                   side='{side}'
//                 </pre>
//               )}
//               <div
//                 key={`${side}-${align}`}
//                 className="flex flex-col items-center gap-2"
//               >
//                 <pre>align='{align}'</pre>
//                 <PopoverDemo align={align} side={side} />
//               </div>
//             </>
//           ))}
//         </div>
//       </section>
//       <section className="flex flex-col h-screen justify-center">
//         <h1 className="font-medium text-xl tracking-tight mb-8 flex items-center gap-2">
//           <CheckIcon className="text-green-500 size-8" />
//           With origin-aware animations
//         </h1>
//         <div className="grid grid-cols-4 gap-x-4 gap-y-12 items-center text-sm">
//           {allCombinations.map(({ side, align }, index) => (
//             <>
//               {index % 3 === 0 && (
//                 <pre key={side} className="font-medium mr-4">
//                   side='{side}'
//                 </pre>
//               )}
//               <div
//                 key={`${side}-${align}`}
//                 className="flex flex-col items-center gap-2"
//               >
//                 <pre>align='{align}'</pre>
//                 <PopoverDemo align={align} side={side} originAware={true} />
//               </div>
//             </>
//           ))}
//         </div>
//       </section>
//     </div>
//   )
// }
