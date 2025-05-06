export const dynamic = 'force-static'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { components } from '@/components/mdx'
import { compileMDX } from 'next-mdx-remote/rsc'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeCallouts from 'rehype-callouts'
import rehypePrettyCode from 'rehype-pretty-code'
import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import 'rehype-callouts/theme/github'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { rehypeNpmCommand } from '@/lib/rehype-npm-command'
import { transformerNotationDiff } from '@shikijs/transformers'
import { format, parse } from 'date-fns'
import type { Metadata } from 'next'
import Link from 'next/link'
import { visit } from 'unist-util-visit'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  const rawContent = await fs.readFile(
    path.join(process.cwd(), 'content/changelog', `${slug}.mdx`),
    'utf-8',
  )

  const { frontmatter: metadata } = await compileMDX<MDXMetadata>({
    source: rawContent,
    options: {
      parseFrontmatter: true,
    },
  })

  if (!metadata) {
    return {}
  }

  return {
    title: metadata.title,
    description: metadata.summary,
    openGraph: {
      title: `${metadata.title} — Changelog`,
      description: metadata.summary,
      type: 'article',
      url: `https://ui.bazza.dev/changelog/${slug}`,
      images: [
        {
          url: metadata.ogImageUrl || '/changelog/og.png',
        },
      ],
    },
    twitter: {
      title: `${metadata.title} — Changelog`,
      description: metadata.summary,
      creator: '@kianbazza',
      card: 'summary_large_image',
      images: [
        {
          url: metadata.ogImageUrl || '/changelog/og.png',
        },
      ],
    },
  }
}

export type MDXMetadata = {
  title: string
  summary: string
  publishedAt: string
  ogImageUrl?: string
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const rawContent = await fs.readFile(
    path.join(process.cwd(), 'content/changelog', `${slug}.mdx`),
    'utf-8',
  )

  const { frontmatter: metadata, content } = await compileMDX<MDXMetadata>({
    source: rawContent,
    components,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          rehypeCallouts,
          () => (tree) => {
            visit(tree, (node) => {
              if (node?.type === 'element' && node?.tagName === 'pre') {
                const [codeEl] = node.children
                if (codeEl.tagName !== 'code') {
                  return
                }

                node.__rawString__ = codeEl.children?.[0].value
              }
            })
          },
          [
            rehypePrettyCode,
            {
              theme: {
                light: 'github-light',
                dark: 'github-dark',
              },
              keepBackground: false,
              transformers: [transformerNotationDiff()],
            } satisfies RehypePrettyCodeOptions,
          ],
          () => (tree) => {
            visit(tree, (node) => {
              if (node?.type === 'element' && node?.tagName === 'figure') {
                if (!('data-rehype-pretty-code-figure' in node.properties)) {
                  return
                }

                const preElement = node.children.at(-1)
                if (preElement.tagName !== 'pre') {
                  return
                }

                preElement.properties.__rawString__ = node.__rawString__
              }
            })
          },
          rehypeNpmCommand,
          rehypeAutolinkHeadings,
        ],
      },
    },
  })

  const publishedAtDate = parse(metadata.publishedAt, 'yyyy-MM-dd', new Date())
  const publishedAtFormatted = format(publishedAtDate, 'iiii, MMMM do, yyyy')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_4fr_1fr] gap-4 max-w-screen-xl w-full mx-auto border-x border-border border-dashed">
      <div className="-mb-8 mt-12 lg:ml-4 px-4 lg:px-0 col-span-1 h-fit lg:w-fit w-full max-w-screen-md mx-auto">
        {/* <Link
          href="/changelog"
          className="inline-flex items-center gap-1 text-sm group lg:sticky lg:top-20"
        >
          <ChevronLeftIcon className="size-3.5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform duration-150" />
          <span className="font-mono text-muted-foreground group-hover:text-primary transition-colors duration-150 font-[450]">
            CHANGELOG.md
          </span>
        </Link> */}
      </div>
      <div className="max-w-[50rem] w-full mx-auto border-border/0 border-dashed xl:border-x">
        <div className="border-b border-border/0 border-dashed">
          <div className="px-4 py-12 max-w-screen-md w-full mx-auto border-border/0 border-dashed xl:border-x flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <span className="font-mono text-muted-foreground tracking-[-0.01em]">
                {publishedAtFormatted}
              </span>
              <span className="text-4xl sm:text-5xl font-[550] tracking-[-0.02em] sm:tracking-[-0.025em]">
                {metadata.title}
              </span>
              <Link
                href="https://x.com/kianbazza"
                className="flex items-center gap-2 group *:transition-all *:duration-150 w-fit"
              >
                <Avatar className="group-hover:brightness-115">
                  <AvatarImage src="/bazza.png" />
                  <AvatarFallback>KB</AvatarFallback>
                </Avatar>
                <span className="font-mono text-muted-foreground group-hover:text-primary font-[450] tracking-[-0.01em] translate-y-0.5 text-sm">
                  Kian Bazza
                </span>
              </Link>
            </div>
            <article className="!select-text">{content}</article>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const filenames = await fs.readdir(
    path.join(process.cwd(), 'content/changelog'),
  )
  const slugs = filenames.map((filename) => filename.replace('.mdx', ''))

  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = false
