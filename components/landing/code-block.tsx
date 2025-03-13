import { cn } from '@/lib/utils'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { BundledLanguage } from 'shiki'
import { codeToHtml } from 'shiki'

interface Props {
  children: string
  className?: React.HTMLAttributes<HTMLDivElement>['className']
  lang: BundledLanguage
  colorReplacements?: Record<string, string>
}

export async function CodeBlock(props: Props) {
  const out = await codeToHtml(props.children, {
    lang: props.lang,
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    colorReplacements: {
      '#121212': 'oklch(0.205 0 0)',
      ...props.colorReplacements,
    },
  })

  return (
    <div
      className={cn(
        'text-sm rounded-md border border-border bg-white dark:bg-neutral-900 w-fit shadow-xs p-4',
        props.className,
      )}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: */}
      <div dangerouslySetInnerHTML={{ __html: out }} />
    </div>
  )
}
