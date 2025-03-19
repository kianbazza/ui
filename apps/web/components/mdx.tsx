import { cn } from '@/lib/utils'
import type { MDXComponents } from 'mdx/types'

export const components: Readonly<MDXComponents> = {
  h1: (props) => (
    <h2 className={cn('text-2xl mt-4', props.className)} {...props} />
  ),
  h2: (props) => (
    <h2
      className={cn(
        'text-3xl font-semibold tracking-[-0.02em] drop-shadow-xs first:mt-0 mt-10 mb-8',
        props.className,
      )}
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className={cn(
        'text-2xl font-semibold tracking-[-0.02em] mt-8 mb-6',
        props.className,
      )}
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className={cn(
        'text-xl font-semibold tracking-[-0.02em] mt-6 mb-4',
        props.className,
      )}
      {...props}
    />
  ),
  h5: (props) => <h5 {...props} />,
  h6: (props) => <h6 {...props} />,
  p: (props) => <p className="mb-4 last:mb-0" {...props} />,
  a: (props) => <a className="underline underline-offset-2" {...props} />,
  ul: (props) => <ul {...props} />,
  ol: (props) => <ol {...props} />,
  li: (props) => <li {...props} />,
  blockquote: (props) => <blockquote {...props} />,
  code: (props) => <code {...props} />,
  pre: (props) => (
    <pre
      className="rounded-xl text-sm border border-sand-4 py-4 px-4 bg-white dark:bg-black my-6 whitespace-pre-wrap"
      {...props}
    >
      {/* <span>{props.filename}</span> */}
      {props.children}
    </pre>
  ),
}
