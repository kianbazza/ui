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
import { DashboardTableOfContents } from '@/components/toc'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { rehypeNpmCommand } from '@/lib/rehype-npm-command'
import { getTableOfContents } from '@/lib/toc'
import { transformerNotationDiff } from '@shikijs/transformers'
import type { Metadata } from 'next'
import { visit } from 'unist-util-visit'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  const rawContent = await fs.readFile(
    path.join(process.cwd(), 'content/docs', `${slug}.mdx`),
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
      title: `${metadata.title} — bazza/ui`,
      description: metadata.summary,
      type: 'article',
      url: `https://ui.bazza.dev/docs/${slug}`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(
            metadata.title,
          )}&description=${encodeURIComponent(metadata.summary)}`,
        },
      ],
    },
    twitter: {
      title: `${metadata.title} — bazza/ui`,
      description: metadata.summary,
      creator: '@kianbazza',
      card: 'summary_large_image',
      images: [
        {
          url: `/og?title=${encodeURIComponent(
            metadata.title,
          )}&description=${encodeURIComponent(metadata.summary)}`,
        },
      ],
    },
  }
}

export type MDXMetadata = {
  title: string
  summary: string
  section: string
  badge?: string
  image?: string
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const rawContent = await fs.readFile(
    path.join(process.cwd(), 'content/docs', `${slug}.mdx`),
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

  const { content: summary } = await compileMDX<MDXMetadata>({
    source: metadata.summary,
    components,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        // rehypePlugins: [rehypeHighlight, rehypeMdxCodeProps],
      },
    },
  })

  const toc = await getTableOfContents(rawContent)

  return (
    <div className="md:col-span-1 xl:col-span-2 md:grid md:grid-cols-subgrid xl:gap-4 px-4 xl:p-0">
      <div className="flex flex-col gap-8 w-full max-w-screen-md mx-auto col-span-1 my-4 md:my-8 xl:my-16 overflow-scroll">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Docs</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{metadata.section}</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{metadata.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <span className="text-5xl font-[550] tracking-[-0.025em]">
              {metadata.title}
            </span>
            {metadata.badge === 'alpha' && (
              <Badge className="bg-pink-400 dark:bg-pink-500 text-white leading-none h-5 [&>span]:translate-y-[-0.5px]">
                <span>{metadata.badge}</span>
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground">{summary}</div>
        </div>
        <div>{content}</div>
      </div>

      <div className="hidden xl:block col-span-1 px-24 sticky mt-16 top-16 h-[calc(100vh-8rem)]">
        {toc && <DashboardTableOfContents toc={toc} />}
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const filenames = await fs.readdir(path.join(process.cwd(), 'content/docs'))
  const slugs = filenames.map((filename) => filename.replace('.mdx', ''))

  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = false
