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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { rehypeNpmCommand } from '@/lib/rehype-npm-command'
import { visit } from 'unist-util-visit'

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
          rehypeHighlight,
          rehypeMdxCodeProps,
          rehypeSlug,
          () => (tree) => {
            visit(tree, (node) => {
              if (node?.type === 'element' && node?.tagName === 'pre') {
                const [codeEl] = node.children
                if (codeEl.tagName !== 'code') {
                  return
                }

                node.properties.__rawString__ = codeEl.children?.[0].value
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
        rehypePlugins: [rehypeHighlight, rehypeMdxCodeProps],
      },
    },
  })

  const toc = await getTableOfContents(rawContent)

  return (
    <div className="md:col-span-1 xl:col-span-2 md:grid md:grid-cols-subgrid xl:gap-4 px-4 xl:p-0">
      <div className="flex flex-col gap-8 w-full max-w-screen-md mx-auto col-span-1 my-4 md:my-8 xl:my-16">
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
            {metadata.badge && (
              <Badge className="bg-pink-500 text-primary">
                {metadata.badge}
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground">{summary}</div>
        </div>
        <div>{content}</div>
      </div>
      <div className="hidden lg:block col-span-1 px-24 sticky mt-16 top-16 h-[calc(100vh-8rem)]">
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
