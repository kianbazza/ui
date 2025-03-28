import { AppSidebar } from '@/components/app-sidebar'
import AppSidebarOpenTrigger from '@/components/app-sidebar-open-trigger'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="md:grid md:grid-cols-[max-content_1fr] xl:grid-cols-[1fr_2fr_1fr] gap-8">
        <AppSidebar />
        <AppSidebarOpenTrigger />
        <main className="md:grid md:grid-cols-subgrid xl:col-span-2 no-scrollbar">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
