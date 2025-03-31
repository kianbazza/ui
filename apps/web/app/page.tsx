import DataTableDemo from '@/components/data-table-filter/demo'
import { GithubIcon, XIcon } from '@/components/icons'
import { CodeBlock } from '@/components/landing/code-block'
import { FadeBlurContainer } from '@/components/landing/fade-blur-container'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import logoSrc from '@/public/bazzaui-v3-color.png'
import filterOperatorsDarkSrc from '@/public/filter-operators-dark.png'
import filterOperatorsLightSrc from '@/public/filter-operators-light.png'
import heroDarkSrc from '@/public/hero-dark.png'
import heroLightSrc from '@/public/hero-light.png'
import {
  ArrowRightIcon,
  CalendarIcon,
  HashIcon,
  LetterTextIcon,
  TagIcon,
  TagsIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

export default function Page() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex items-center gap-4 justify-between h-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium font-mono tracking-tight text-sm"
            >
              <Image
                className="size-6 mr-1 translate-y-[-0.75px]"
                src={logoSrc}
                alt="bazza/ui"
              />
              <span>bazza</span>
              <span className="text-xl text-border">/</span>
              <span>ui</span>
            </Link>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://x.com/kianbazza">
                  <XIcon className="size-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://github.com/bazzadev/ui">
                  <GithubIcon className="size-5" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="px-4 py-12 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x flex flex-col lg:flex-row items-center gap-x-4 gap-y-12 lg:justify-between">
          <div className="flex lg:flex-row flex-col gap-8">
            <div className="flex flex-col gap-8 w-full">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-8">
                  <h1 className="text-5xl lg:text-6xl font-[538] tracking-[-0.03em] drop-shadow-xs text-center lg:text-left">
                    Data table filters for <br className="hidden lg:block" />
                    your next project.
                  </h1>
                  <div className="*:text-lg leading-none *:lg:text-xl *:tracking-[-0.01em] *:font-[410] text-neutral-800 dark:text-neutral-300 flex flex-col gap-1 text-center lg:text-left">
                    <span>
                      A powerful data table filter component inspired by Linear.
                    </span>
                    <span>Built with shadcn/ui and TanStack Table.</span>
                    <span className="!font-[538] dark:text-primary">
                      Open source. Open code. Free to use.
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center lg:block">
                <Button
                  size="lg"
                  className="shadow-md hover:shadow-lg transition-[box-shadow,background-color]"
                  asChild
                >
                  <Link href="/docs/intro">
                    Get started <ArrowRightIcon className="translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:w-[450px] w-full">
            <Image className="dark:hidden" src={heroLightSrc} alt="Hero" />
            <Image className="hidden dark:block" src={heroDarkSrc} alt="Hero" />
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="xl:border-x border-border border-dashed px-4 py-24 max-w-screen-xl w-full mx-auto space-y-4 h-[800px]">
          <h2 className="text-5xl tracking-[-0.03em] font-semibold drop-shadow-xs text-center">
            Check out the demo.
          </h2>
          <Suspense>
            <DataTableDemo />
          </Suspense>
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="px-4 py-12 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex lg:flex-row flex-col gap-8">
            <div className="space-y-4">
              <h2 className="text-5xl tracking-[-0.03em] font-semibold drop-shadow-xs">
                Easy to use.
              </h2>
              <span className="font-[410]">
                We've designed this component to make it as easy as possible to
                get started. Just add a few lines to your existing TanStack
                Table columns definition and you're ready to go.
              </span>
            </div>
            <div>
              <CodeBlock
                lang="tsx"
                className="bg-surface rounded-2xl"
                colorReplacements={{
                  '#24292e': '#010101FF',
                }}
              >
                {[
                  'export const columns: ColumnDef<Issue>[] = [',
                  '  /* ..other columns */',
                  '  {',
                  "    accessorKey: 'status',",
                  "    header: 'Status',",
                  "    filterFn: filterFn('option'),  // [!code ++]",
                  '    meta: {  // [!code ++]',
                  "      displayName: 'Status',  // [!code ++]",
                  "      type: 'option',  // [!code ++]",
                  '      icon: CircleDotDashedIcon,  // [!code ++]',
                  '      options: issueStatuses.map((x) => ({ ...x, label: x.name })),  // [!code ++]',
                  '    },  // [!code ++]',
                  '  }  // [!code ++]',
                  ']',
                ].join('\n')}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="px-4 py-12 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8">
            <h2 className="text-5xl tracking-[-0.03em] font-semibold drop-shadow-xs">
              Powerful.
            </h2>
            <div className="grid grid-rows-3 lg:grid-rows-1 lg:grid-cols-3 gap-4 *:bg-background dark:*:bg-surface">
              <div className="flex flex-col justify-between gap-8 rounded-2xl bg-background dark:bg-surface p-6 shadow-xs border border-border">
                <CodeBlock
                  lang="typescript"
                  className="[&>pre]:p-0 border-none shadow-none dark:bg-surface"
                  colorReplacements={{
                    '#24292e': 'transparent',
                  }}
                >
                  {[
                    'export type Issue = {',
                    '  id: string',
                    '  title: string',
                    '  description?: string',
                    '  status: IssueStatus',
                    '  assignee?: User',
                    '  labels?: IssueLabel[]',
                    '  startDate?: Date',
                    '  endDate?: Date',
                    '  estimatedHours?: number',
                    '}',
                  ].join('\n')}
                </CodeBlock>
                <div className="space-y-4">
                  <h3 className="text-2xl tracking-[-0.02em] font-[510] drop-shadow-xs">
                    Data types.
                  </h3>
                  <ul className="flex flex-wrap gap-x-4 *:inline-flex *:items-center *:gap-1.5 *:[&>svg]:size-4 text-muted-foreground">
                    <li>
                      <HashIcon /> Number
                    </li>
                    <li>
                      <LetterTextIcon /> Text
                    </li>
                    <li>
                      <CalendarIcon /> Date
                    </li>
                    <li>
                      <TagIcon /> Option
                    </li>
                    <li>
                      <TagsIcon /> Multi Option
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-8 rounded-2xl bg-background p-6 shadow-xs border border-border">
                <div className="relative h-full w-full">
                  <Image
                    className="dark:hidden"
                    alt="Filter operators"
                    fill
                    style={{ objectFit: 'contain' }}
                    src={filterOperatorsLightSrc}
                  />
                  <Image
                    className="hidden dark:block"
                    alt="Filter operators"
                    fill
                    style={{ objectFit: 'contain' }}
                    src={filterOperatorsDarkSrc}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl tracking-[-0.02em] font-[510] drop-shadow-xs">
                    Operators.
                  </h3>
                  <span className="text-muted-foreground">
                    Negation, target types (single or multiple), and related
                    operators - they just <i>work</i>.
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-8 rounded-2xl bg-background p-6 shadow-xs border border-border overflow-hidden">
                <FadeBlurContainer
                  lightFadeColor="#ffffff"
                  darkFadeColor="#010101FF"
                  fadeStart={75}
                  fadeDirection={['right', 'bottom']}
                  className="h-[200px]"
                >
                  <CodeBlock
                    lang="typescript"
                    className="[&>pre]:p-0 border-none shadow-none text-[0.6rem] dark:bg-surface"
                    colorReplacements={{
                      '#24292e': 'transparent',
                    }}
                  >
                    {[
                      'type FilterOperatorDetailsBase<OperatorValue, T extends ColumnDataType> = {',
                      '  /* The operator value. Usually the string representation of the operator. */',
                      '  value: OperatorValue',
                      '  /* The label for the operator, to show in the UI. */',
                      '  label: string',
                      '  /* How much data the operator applies to. */',
                      "  target: 'single' | 'multiple'",
                      '  /* The plural form of the operator, if applicable. */',
                      '  singularOf?: FilterOperators[T]',
                      '  /* The singular form of the operator, if applicable. */',
                      '  pluralOf?: FilterOperators[T]',
                      '  /* All related operators. Normally, all the operators which share the same target. */',
                      '  relativeOf: FilterOperators[T] | Array<FilterOperators[T]>',
                      '  /* Whether the operator is negated. */',
                      '  isNegated: boolean',
                      '  /* If the operator is not negated, this provides the negated equivalent. */',
                      '  negation?: FilterOperators[T]',
                      '  /* If the operator is negated, this provides the positive equivalent. */',
                      '  negationOf?: FilterOperators[T]',
                      '}',
                    ].join('\n')}
                  </CodeBlock>
                </FadeBlurContainer>

                <div className="space-y-4">
                  <h3 className="text-2xl tracking-[-0.02em] font-[510] drop-shadow-xs">
                    End-to-end type safety.
                  </h3>
                  <span className="text-muted-foreground">
                    Countless hours have been spent on designing a type-safe
                    interface, at your disposal.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
