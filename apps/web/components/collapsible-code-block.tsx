export default function CollapsibleCodeBlock({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="relative [&>pre]:max-h-[400px] [&>pre]:overflow-y-auto">
      {children}
    </div>
  )
}
