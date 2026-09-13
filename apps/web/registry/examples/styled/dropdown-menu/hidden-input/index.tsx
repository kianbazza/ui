'use client'

import { CheckIcon } from 'lucide-react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuHiddenInput() {
  const [activeWorkspaceId, setActiveWorkspaceId] =
    React.useState<string>('bazza-labs')
  const activeWorkspace = React.useMemo(() => {
    return accounts
      .flatMap((account) => account.workspaces)
      .find((ws) => ws.id === activeWorkspaceId)!
  }, [activeWorkspaceId])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="w-40"
        render={<Button variant="outline" />}
      >
        <Avatar className="size-4 min-h-4 min-w-4">
          <AvatarImage src={activeWorkspace.imageUrl} />
        </Avatar>
        {activeWorkspace.name}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface autoHighlightFirst={activeWorkspaceId}>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List maxHeight="1000">
                {accounts.map(({ email, workspaces }) => (
                  <DropdownMenu.Group key={email}>
                    <DropdownMenu.GroupLabel>{email}</DropdownMenu.GroupLabel>
                    {workspaces.map((workspace) => (
                      <DropdownMenu.Item
                        key={workspace.id}
                        value={workspace.id}
                        onSelect={() => setActiveWorkspaceId(workspace.id)}
                      >
                        <DropdownMenu.Icon>
                          <Avatar className="min-h-4 min-w-4 size-4">
                            <AvatarImage src={workspace.imageUrl} />
                            <AvatarFallback>
                              {workspace.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </DropdownMenu.Icon>
                        {workspace.name}
                        {activeWorkspaceId === workspace.id && (
                          <CheckIcon className="ml-auto size-5" />
                        )}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Group>
                ))}

                <DropdownMenu.Separator />

                <DropdownMenu.Group>
                  <DropdownMenu.GroupLabel>Account</DropdownMenu.GroupLabel>
                  <DropdownMenu.Item>
                    Create or join a workspace...
                    <Badge variant="secondary" className="mix-blend-multiply">
                      3 available
                    </Badge>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item>Add an account...</DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

type Workspace = {
  id: string
  name: string
  imageUrl: string
}

type Account = {
  email: string
  workspaces: Workspace[]
}

const accounts: Account[] = [
  {
    email: 'kian@bazza.dev',
    workspaces: [
      {
        id: 'bazza-labs',
        name: 'Bazza Labs',
        imageUrl: 'https://github.com/bazzalabs.png',
      },
      {
        id: 'avelin',
        name: 'Avelin',
        imageUrl: 'https://github.com/avelinapp.png',
      },
      {
        id: 'bazza-ui',
        name: 'bazza/ui',
        imageUrl: 'https://github.com/bazza-ui.png',
      },
    ],
  },
  {
    email: 'kian@navattic.com',
    workspaces: [
      {
        id: 'navattic',
        name: 'Navattic',
        imageUrl: 'https://github.com/navattic.png',
      },
    ],
  },
  {
    email: 'kian@vercel.com',
    workspaces: [
      {
        id: 'vercel',
        name: 'Vercel',
        imageUrl: 'https://github.com/vercel.png',
      },
    ],
  },
]
