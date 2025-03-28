'use client'

import { CheckIcon, ClipboardIcon } from 'lucide-react'
import * as React from 'react'

import { copyToClipboardWithMeta } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfig } from '@/hooks/use-config'
import type { NpmCommands } from '@/types/unist'
import Link from 'next/link'
import { BunIcon, NpmIcon, PnpmIcon, XIcon, YarnIcon } from './icons'

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

const packageManagerIcons = {
  pnpm: PnpmIcon,
  npm: NpmIcon,
  yarn: YarnIcon,
  bun: BunIcon,
} as const

export function CodeBlockCommand({
  __npmCommand__,
  __yarnCommand__,
  __pnpmCommand__,
  __bunCommand__,
}: React.ComponentProps<'pre'> & NpmCommands) {
  const [config, setConfig] = useConfig()
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const packageManager = config.packageManager || 'pnpm'
  const tabs = React.useMemo(() => {
    return {
      pnpm: __pnpmCommand__,
      npm: __npmCommand__,
      yarn: __yarnCommand__,
      bun: __bunCommand__,
    }
  }, [__npmCommand__, __pnpmCommand__, __yarnCommand__, __bunCommand__])

  const copyCommand = React.useCallback(async () => {
    const command = tabs[packageManager]

    if (!command) {
      return
    }

    // @ts-ignore
    await window.stonks.event('Copied component installation command', {
      packageManager,
      component: 'data-table-filter',
    })

    console.log('Copied component installation command', command)

    copyToClipboardWithMeta(command)
    setHasCopied(true)
  }, [packageManager, tabs])

  return (
    <div className="relative mt-6 max-h-[650px] overflow-x-auto rounded-md bg-white dark:bg-black border border-border">
      <Tabs
        value={packageManager}
        onValueChange={(value) => {
          setConfig({
            ...config,
            packageManager: value as PackageManager,
          })
        }}
      >
        <div className="flex items-center justify-between border-b border-neutral-150 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 pt-2.5">
          <TabsList className="h-7 translate-y-[2px] gap-3 bg-transparent p-0 pl-1">
            {Object.entries(tabs).map(([key, value]) => {
              const Icon = packageManagerIcons[key as PackageManager]
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-1.5 rounded-none border-b border-transparent bg-transparent text-[13px] p-0 pb-1.5 dark:text-neutral-400 text-neutral-600 data-[state=active]:border-neutral-950 dark:data-[state=active]:border-neutral-50 data-[state=active]:shadow-none outline-none data-[state=active]:bg-transparent data-[state=active]:text-neutral-950 dark:data-[state=active]:text-neutral-50"
                >
                  <Icon className="size-3.5" />
                  {key}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>
        {Object.entries(tabs).map(([key, value]) => {
          return (
            <>
              <TabsContent
                key={key}
                value={key}
                className="mt-0 relative flex flex-col py-8 h-full w-full"
              >
                <pre className="px-4 py-5 select-none">
                  <code
                    className="relative font-mono text-sm leading-none"
                    data-language="bash"
                  >
                    {value}
                  </code>
                </pre>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center gap-2 backdrop-blur-lg *:text-center px-4">
                  <span className="font-medium md:text-lg">
                    We're launching soon —{' '}
                    <XIcon className="inline translate-y-[-1px]" />{' '}
                    <Link
                      href="https://x.com/kianbazza"
                      className="underline underline-offset-2"
                    >
                      @kianbazza
                    </Link>{' '}
                    for updates.
                  </span>
                  <span>You can browse the docs and explore the examples.</span>
                </div>
              </TabsContent>
              {/* <TabsContent key={key} value={key} className="mt-0"> */}
              {/*   <pre className="px-4 py-5"> */}
              {/*     <code */}
              {/*       className="relative font-mono text-sm leading-none" */}
              {/*       data-language="bash" */}
              {/*     > */}
              {/*       {value} */}
              {/*     </code> */}
              {/*   </pre> */}
              {/* </TabsContent> */}
            </>
          )
        })}
      </Tabs>
      <Button
        size="icon"
        variant="ghost"
        disabled
        className="absolute right-2.5 top-2 z-10 h-6 w-6 dark:text-neutral-50 dark:hover:bg-neutral-700 dark:hover:text-neutral-50 hover:bg-neutral-200"
        onClick={copyCommand}
      >
        <span className="sr-only">Copy</span>
        {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
      </Button>
    </div>
  )
}
