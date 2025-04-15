import { TypeTable } from '@/components/type-table'
import { cn } from '@/lib/utils'
import type { NpmCommands } from '@/types/unist'
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import { CodeBlockCommand } from './code-block-command'
import CollapsibleCodeBlock from './collapsible-code-block'
import DataTableDemo from './data-table-filter-demo/demo'
import { ResponsiveImage } from './responsive-image'

export const components: Readonly<MDXComponents> = {
  h1: (props) => (
    <h2 className={cn('text-2xl mt-4', props.className)} {...props} />
  ),
  h2: (props) => (
    <h2
      className={cn(
        'text-3xl font-semibold tracking-[-0.02em] drop-shadow-xs first:mt-0 mt-20 mb-8',
        '[&>code]:text-2xl',
        props.className,
      )}
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className={cn(
        'text-2xl font-semibold tracking-[-0.02em] mt-18 mb-6',
        '[&>code]:text-xl',
        props.className,
      )}
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className={cn(
        'text-xl font-semibold tracking-[-0.02em] mt-16 mb-6',
        '[&>code]:text-lg',
        props.className,
      )}
      {...props}
    />
  ),
  h5: (props) => (
    <h5
      className={cn(
        'text-lg font-semibold tracking-[-0.01em] mt-14 mb-4',
        '[&>code]:text-base',
        props.className,
      )}
      {...props}
    />
  ),
  h6: (props) => <h6 {...props} />,
  p: (props) => <p className="mb-4 last:mb-0 leading-7" {...props} />,
  a: (props) => (
    <a className="underline decoration-[0.5px] underline-offset-2" {...props} />
  ),
  u: (props) => <u className="underline underline-offset-2" {...props} />,
  strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className={cn('font-semibold', className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        'my-6 ml-6 list-disc [&>li>ul]:my-2 [&>li>ul]:ml-4',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        'my-6 ml-6 list-decimal [&>li>ol]:my-2 [&>li>ol]:ml-4 [&>li>ol]:list-lower-alpha [&>li>ol>li>ol]:list-lower-roman',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('mt-2', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className={cn(
        'mt-6 mb-6 border-l-4 border-neutral-400 dark:border-neutral-600 rounded-md px-6 py-4 [&_code]:not-italic [&_code]:border-[0.5px] bg-accent/30 italic text-neutral-700 dark:text-neutral-300',
        className,
      )}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: <explanation>
    <img className={cn('rounded-md', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-4 md:my-8" {...props} />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table
        className={cn(
          'relative w-full overflow-hidden border-none text-sm',
          className,
        )}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn('last:border-b-none m-0 border-b', className)}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        'px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        'px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'relative rounded-sm bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className,
      )}
      {...props}
    />
  ),
  pre: ({
    className,
    __rawString__,
    __npmCommand__,
    __yarnCommand__,
    __pnpmCommand__,
    __bunCommand__,
    __withMeta__,
    __src__,
    ...props
  }: React.HTMLAttributes<HTMLPreElement> & {
    __rawString__?: string
    __withMeta__?: boolean
    __src__?: string
  } & NpmCommands) => {
    const isNpmCommand =
      __npmCommand__ && __yarnCommand__ && __pnpmCommand__ && __bunCommand__

    if (isNpmCommand) {
      return (
        <CodeBlockCommand
          className="font-mono"
          __npmCommand__={__npmCommand__}
          __yarnCommand__={__yarnCommand__}
          __pnpmCommand__={__pnpmCommand__}
          __bunCommand__={__bunCommand__}
        />
      )
    }

    return (
      <pre
        // className="rounded-xl text-sm border [&>code]:bg-transparent [&>code]:p-0 border-border py-4 px-4 bg-white dark:bg-black my-6 font-mono"
        {...props}
      >
        {props.children}
      </pre>
    )
  },
  DataTableDemo,
  Image,
  ResponsiveImage: (props) => (
    <ResponsiveImage
      wrapperClassName={cn('my-6', props.wrapperClassName)}
      {...props}
    />
  ),
  CollapsibleCodeBlock,
  TypeTable,
}
