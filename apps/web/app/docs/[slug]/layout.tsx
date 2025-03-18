import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="grid grid-cols-3 w-full h-full">
        <AppSidebar />
        <main>{children}</main>
        <div></div>
      </div>
    </SidebarProvider>
  )
}
