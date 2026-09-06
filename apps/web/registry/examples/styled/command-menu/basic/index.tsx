'use client'

import {
  ArchiveIcon,
  BoxIcon,
  CircleIcon,
  ClockIcon,
  FileIcon,
  GitPullRequestIcon,
  GoalIcon,
  LayersIcon,
  PlusIcon,
  TagIcon,
  UsersRoundIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export default function CommandMenuBasic() {
  return (
    <CommandMenu.Root hotkey="mod+k">
      <CommandMenu.Trigger render={<Button variant="outline" />}>
        Open
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Backdrop />
        <CommandMenu.Popup>
          <CommandMenu.Surface>
            <CommandMenu.Input />
            <CommandMenu.List>
              <CommandMenu.Empty />
              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Issues</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <PlusIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create new issue...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="c p" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <PlusIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create new issue in fullscreen...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="v" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <TagIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create new label...
                </CommandMenu.Item>
              </CommandMenu.Group>

              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Projects</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <BoxIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create new project...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="n p" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
              </CommandMenu.Group>

              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Documents</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <FileIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create new document in...
                </CommandMenu.Item>
              </CommandMenu.Group>

              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Views</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <LayersIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create view...
                </CommandMenu.Item>
              </CommandMenu.Group>

              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Initiatives</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <GoalIcon className="size-4" />
                  </CommandMenu.Icon>
                  Create initiative...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="n i" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
              </CommandMenu.Group>

              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Navigation</CommandMenu.GroupLabel>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <GitPullRequestIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open pull requests...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="O R" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <ClockIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open last viewed issue...
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <CircleIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open issue...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="O I" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <UsersRoundIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open team...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="O T" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>

                <CommandMenu.Item>
                  <CommandMenu.Icon>
                    <ArchiveIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open team archive...
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="O X" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
              </CommandMenu.Group>
            </CommandMenu.List>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}
