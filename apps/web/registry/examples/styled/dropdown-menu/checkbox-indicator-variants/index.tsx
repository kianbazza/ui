'use client'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { Select } from '@/registry/ui/select'

export default function DropdownMenuCheckboxIndicatorVariants() {
  const [variant, setVariant] = React.useState<'checkbox' | 'check'>('checkbox')
  const [minimap, setMinimap] = React.useState(true)
  const [search, setSearch] = React.useState(true)
  const [sidebar, setSidebar] = React.useState(false)

  return (
    <div className="flex items-center gap-2">
      <Select.Root
        value={variant}
        onValueChange={(value) => setVariant(value as 'checkbox' | 'check')}
      >
        <Select.Trigger render={<Button variant="outline" />}>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Surface>
                <Select.List>
                  <Select.Item value="checkbox">
                    <Select.ItemLabel>Checkbox</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="check">
                    <Select.ItemLabel>Check</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger render={<Button variant="outline" />}>
          Layout
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.CheckboxItem
                    checked={minimap}
                    onCheckedChange={setMinimap}
                  >
                    <DropdownMenu.CheckboxItemIndicator variant={variant} />
                    Minimap
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    checked={search}
                    onCheckedChange={setSearch}
                  >
                    <DropdownMenu.CheckboxItemIndicator variant={variant} />
                    Search
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    checked={sidebar}
                    onCheckedChange={setSidebar}
                  >
                    <DropdownMenu.CheckboxItemIndicator variant={variant} />
                    Sidebar
                  </DropdownMenu.CheckboxItem>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
