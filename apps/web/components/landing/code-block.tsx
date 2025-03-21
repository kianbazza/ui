import { cn } from '@/lib/utils'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { BundledLanguage } from 'shiki'
import { codeToHtml } from 'shiki'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: string
  lang: BundledLanguage
  colorReplacements?: Record<string, string>
}

export async function CodeBlock({
  children,
  className,
  lang,
  colorReplacements,
  ...props
}: Props) {
  const out = await codeToHtml(children, {
    lang,
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    colorReplacements: {
      '#121212': 'oklch(0.205 0 0)',
      ...colorReplacements,
    },
  })

  return (
    <div
      className={cn(
        '**:font-mono text-sm rounded-md border border-border bg-white dark:bg-neutral-900 shadow-xs [&>pre]:p-4',
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
      dangerouslySetInnerHTML={{ __html: out }}
      {...props}
    />
  )
}
