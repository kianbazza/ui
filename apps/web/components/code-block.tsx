'use client'

import { highlight } from '@/lib/highlighter'
import { cn } from '@/lib/utils'
import { type HTMLAttributes, type JSX, useLayoutEffect, useState } from 'react'
import type { BundledLanguage } from 'shiki/bundle-web.mjs'

interface CodeBlockWrapperProps extends HTMLAttributes<HTMLDivElement> {
  loading?: boolean
}

export const CodeBlockWrapper = ({
  className,
  children,
  loading,
  ...props
}: CodeBlockWrapperProps) => {
  return (
    <div
      className={cn(
        '**:font-mono text-sm rounded-2xl *:rounded-2xl border border-border bg-white dark:bg-neutral-900 shadow-xs',
        className,
      )}
    >
      {loading ? 'Loading...' : children}
    </div>
  )
}

export function CodeBlock({
  code,
  lang,
}: { code: string; lang: BundledLanguage }) {
  const [nodes, setNodes] = useState<JSX.Element | null>(null)

  useLayoutEffect(() => {
    void highlight(code, lang).then(setNodes)
  }, [code, lang])

  return <CodeBlockWrapper loading={!nodes}>{nodes}</CodeBlockWrapper>
}
