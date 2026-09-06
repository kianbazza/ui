'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'

type CollapsibleContextType = {
  isOpen: boolean
}

const CollapsibleContext = React.createContext<
  CollapsibleContextType | undefined
>(undefined)

const useCollapsible = (): CollapsibleContextType => {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible')
  }
  return context
}

function Collapsible({
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  const [isOpen, setIsOpen] = React.useState(
    props?.open ?? props?.defaultOpen ?? false,
  )
  const onOpenChange = props.onOpenChange

  React.useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open)
  }, [props?.open])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange],
  )
  return (
    <CollapsibleContext.Provider value={{ isOpen }}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        {...props}
        onOpenChange={handleOpenChange}
      >
        {children}
      </CollapsiblePrimitive.Root>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  const { isOpen } = useCollapsible()

  return (
    <AnimatePresence>
      {isOpen && (
        <CollapsiblePrimitive.CollapsibleContent asChild forceMount {...props}>
          <motion.div
            data-slot="collapsible-content"
            key="collapsible-content"
            layout
            transition={{ duration: 0.1, ease: 'easeOut' }}
            initial={{
              height: 0,
              opacity: 0,
              y: -8,
              filter: 'blur(4px)',
              overflow: 'hidden',
            }}
            animate={{
              height: 'auto',
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              overflow: 'visible',
            }}
            exit={{
              height: 0,
              opacity: 0,
              y: -8,
              filter: 'blur(4px)',
              overflow: 'hidden',
            }}
          >
            {children}
          </motion.div>
        </CollapsiblePrimitive.CollapsibleContent>
      )}
    </AnimatePresence>
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
