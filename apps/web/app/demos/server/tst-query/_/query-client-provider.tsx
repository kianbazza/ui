'use client'

import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from '@tanstack/react-query'

export default function QueryClientProvider({
  children,
}: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  )
}
