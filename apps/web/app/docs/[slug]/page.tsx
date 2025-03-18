export const dynamic = 'force-static'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { components } from '@/components/mdx'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeMdxCodeProps from 'rehype-mdx-code-props'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import { getTableOfContents } from '@/lib/toc'
import { DashboardTableOfContents } from '@/components/toc'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type MDXMetadata = {
  title: string
  summary: string
  section: string
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
          rehypeHighlight,
          rehypeMdxCodeProps,
          rehypeSlug,
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
        rehypePlugins: [rehypeHighlight, rehypeMdxCodeProps],
      },
    },
  })

  const toc = await getTableOfContents(rawContent)

  return (
    <div className="col-span-2 grid grid-cols-subgrid gap-4">
      <div className="flex flex-col gap-8 max-w-screen-md mx-auto col-span-1 mt-16 mb-16">
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

        <div className="flex flex-col gap-4">
          <span className="text-5xl font-[550] tracking-[-0.025em]">
            {metadata.title}
          </span>
          <div className="text-muted-foreground">{summary}</div>
        </div>
        <div>{content}</div>
      </div>
      <div className="col-span-1 justify-self-end px-24 sticky mt-16 top-16 h-[calc(100vh-8rem)]">
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
