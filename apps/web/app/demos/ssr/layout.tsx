import QueryClientProvider from './_/query-client-provider'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>
}
