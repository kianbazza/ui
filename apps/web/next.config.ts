import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['next-mdx-remote'],
  redirects: async () => [
    {
      source: '/chat',
      destination: 'https://discord.gg/KJatePVVxu',
      permanent: false,
    },
    {
      source: '/docs',
      destination: '/docs/intro',
      permanent: false,
    },
    {
      source: '/feedback',
      destination: 'https://bazzaui.userjot.com',
      permanent: false,
    },
    {
      source: '/filters',
      destination: '/docs/data-table-filter',
      permanent: false,
    },
    {
      source: '/r/filters',
      destination: '/r/data-table-filter.json',
      permanent: false,
    },
    {
      source: '/r/data-table-filter',
      destination: '/r/data-table-filter.json',
      permanent: false,
    },
    {
      source: '/r/filters/i18n',
      destination: '/r/data-table-filter-i18n.json',
      permanent: false,
    },
  ],
}

export default nextConfig
