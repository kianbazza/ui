'use client'

import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'

export function Info({ children }: { children: ReactNode }): ReactNode {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-7',
        )}
      >
        <InfoIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="overflow-auto text-sm">
        {children}
      </PopoverContent>
    </Popover>
  )
}

interface ObjectType {
  /**
   * Additional description of the field
   */
  description?: ReactNode
  type: string
  typeDescription?: ReactNode
  /**
   * Optional link to the type
   */
  typeDescriptionLink?: string
  default?: string

  required?: boolean
}

export function TypeTable({ type }: { type: Record<string, ObjectType> }) {
  return (
    <div className="my-6 overflow-auto border border-border rounded-md">
      <Table className="w-full whitespace-nowrap text-sm font-mono">
        <TableHeader className="bg-neutral-100 dark:bg-neutral-900">
          <TableRow>
            <TableHead className="w-[45%]">Prop</TableHead>
            <TableHead className="w-[30%]">Type</TableHead>
            <TableHead className="w-1/4">Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white dark:bg-black">
          {Object.entries(type).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>
                <div>
                  <code className="rounded-sm bg-blue-300/25 dark:text-primary text-blue-700 dark:bg-blue-600/50 px-[0.35rem] py-[0.2rem]">
                    {key}
                    {!value.required && '?'}
                  </code>
                  {value.description ? <Info>{value.description}</Info> : null}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem]">
                    {value.type}
                  </code>
                  {value.typeDescription ? (
                    <Info>{value.typeDescription}</Info>
                  ) : null}
                  {value.typeDescriptionLink ? (
                    <Link href={value.typeDescriptionLink}>
                      <InfoIcon className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {value.default ? (
                  <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem]">
                    {value.default}
                  </code>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
