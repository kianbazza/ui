export const dynamic = 'force-static'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { components } from '@/components/mdx'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeMdxCodeProps from 'rehype-mdx-code-props'

export type MDXMetadata = {
  title: string
  published_at: string
  summary: string
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
        rehypePlugins: [rehypeHighlight, rehypeMdxCodeProps],
      },
    },
  })

  return (
    <div className="mt-16 flex flex-col gap-8 max-w-screen-md mx-auto">
      <span className="text-4xl font-bold">{metadata.title}</span>
      <div>{metadata.published_at}</div>
      <div className="border-l-2 border-border pl-4 py-1">
        {metadata.summary}
      </div>
      <div>{content}</div>
    </div>
  )
}

export async function generateStaticParams() {
  const filenames = await fs.readdir(path.join(process.cwd(), 'content/docs'))
  const slugs = filenames.map((filename) => filename.replace('.mdx', ''))

  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = false
