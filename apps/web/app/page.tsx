import {
  BazzaUIIcon,
  DiscordIcon,
  GithubIcon,
  UserJotIcon,
  XIcon,
} from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import logoSrc from '@/public/bazzaui-v3-color.png'
import { ArrowRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { IssuesTableFallback } from './demos/server/tst-query/_/issues-table-fallback'
import { IssuesTableWrapper } from './demos/server/tst-query/_/issues-table-wrapper'

export default function Page() {
  return (
    <div className="flex flex-col min-h-svh select-none">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50 h-12">
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
                <Link href="https://ui.bazza.dev/chat">
                  <DiscordIcon className="size-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://github.com/kianbazza/ui">
                  <GithubIcon className="size-5" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <div className="border-y border-border border-dashed">
        <div className="px-4 py-16 sm:py-32 max-w-screen-xl w-full mx-auto border-border border-y-0 border-dashed xl:border-x flex flex-col-reverse lg:flex-row items-center gap-x-12 gap-y-12 lg:justify-between border">
          <div className="flex lg:flex-row flex-col gap-8 max-w-4xl">
            <div className="flex flex-col gap-8 w-full">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-8">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-[538] tracking-[-0.03em] drop-shadow-xs text-center lg:text-left">
                    A React component library with{' '}
                    <span className="inline whitespace-nowrap">
                      hand-crafted
                    </span>
                    , modern
                    <span className="lg:inline hidden">, and powerful</span>{' '}
                    components.
                  </h1>
                  <div className="*:text-base sm:*:text-lg leading-none *:lg:text-xl *:tracking-[-0.01em] *:font-[410] text-neutral-800 dark:text-neutral-300 flex flex-col gap-1 text-center lg:text-left">
                    <span>Powerful components for your next project.</span>
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
          <BazzaUIIcon className="drop-shadow-2xl h-auto w-[150px] sm:w-[300px] lg:w-[900px]" />
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="px-4 py-12 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x flex flex-col items-center gap-12 sm:gap-16">
          <div className="space-y-6 sm:space-y-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[538] tracking-[-0.03em] drop-shadow-xs">
              Playground
            </h2>
            <div className="text-base sm:text-lg lg:text-lg tracking-[-0.01em] font-[510] text-neutral-600 dark:text-neutral-300 space-y-1 sm:space-y-0">
              <p>Our first component is a data table filter.</p>
              <p>
                It's library-agnostic and supports client and server-side
                filtering.
              </p>
              <p>Take it for a spin in the playground below.</p>
            </div>
          </div>
          <Suspense fallback={<IssuesTableFallback />}>
            <IssuesTableWrapper />
          </Suspense>
        </div>
      </div>
      <div className="border-b border-border border-dashed">
        <div className="px-4 py-12 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x text-center flex flex-col items-center gap-12 sm:gap-16">
          <div className="space-y-4 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[538] tracking-[-0.03em] drop-shadow-xs">
              Sponsors
            </h2>
            <p className="text-base sm:text-lg lg:text-lg tracking-[-0.01em] font-[510] text-neutral-600 dark:text-neutral-300">
              We wouldn't be able to build this without the support of our
              amazing sponsors.
            </p>
          </div>
          <div className="flex items-center justify-center gap-12">
            <Link
              className="flex justify-center items-end gap-3 dark:text-neutral-200 dark:hover:text-white text-neutral-700 hover:text-black transition-all hover:scale-105"
              href="https://userjot.com"
            >
              <UserJotIcon className="size-6 sm:size-8" />
              <span className="text-base sm:text-xl font-[538] tracking-[-0.01em]">
                UserJot
              </span>
            </Link>
          </div>
          <p className="text-base tracking-[-0.01em] font-[510] text-muted-foreground leading-none">
            Want to support bazza/ui?{' '}
            <Link
              href="mailto:kian@bazza.dev?subject=bazza%2Fui%20-%20I%20want%20to%20sponsor%20you&body=Hey%20Kian%2C"
              className="relative text-neutral-800 dark:text-neutral-200 group/sponsor-link hover:underline underline-offset-2"
            >
              Become a sponsor.
              <ArrowRightIcon className="absolute ml-1 group-hover/sponsor-link:inline hidden size-4 translate-y-[-0.5px] stroke-[2.5] animate-in slide-in-from-left-1" />
            </Link>
          </p>
        </div>
      </div>
      <div className="border-border border-dashed flex flex-col flex-1">
        <div className="px-4 py-12 flex-1 h-full max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x"></div>
      </div>
    </div>
  )
}
