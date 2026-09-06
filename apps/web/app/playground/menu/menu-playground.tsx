'use client'

import { Collapsible } from '@base-ui/react/collapsible'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useComboboxItemContext } from '@bazza-ui/react/combobox'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// ============================================================================
// Helper: Prevent menu close when clicking config panel
// ============================================================================

interface OpenChangeEventDetails {
  reason: string
  event?: Event | null
  cancel: () => void
}

/**
 * Helper to prevent closing menus when clicking on the config panel.
 * Call this at the start of any onOpenChange handler.
 * Returns true if the close was cancelled (handler should return early).
 */
function shouldPreventCloseOnConfigPanel(
  nextOpen: boolean,
  eventDetails: OpenChangeEventDetails,
): boolean {
  if (!nextOpen && eventDetails.reason === 'outside-press') {
    const configPanel = document.querySelector('[data-config-panel]')
    const target = eventDetails.event?.target as Node | null
    if (configPanel?.contains(target)) {
      eventDetails.cancel()
      return true
    }
  }
  return false
}

// ============================================================================
// Animated Chevrons Icon (morphs between up-down and down-up states)
// ============================================================================

interface AnimatedChevronsIconProps {
  open: boolean
  className?: string
}

function AnimatedChevronsIcon({ open, className }: AnimatedChevronsIconProps) {
  const swapDistance = 11

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="m7 9 5-5 5 5"
        initial={false}
        animate={{ y: open ? swapDistance : 0 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      />
      <motion.path
        d="m7 15 5 5 5-5"
        initial={false}
        animate={{ y: open ? -swapDistance : 0 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      />
    </svg>
  )
}

// ============================================================================
// Highlight Indicator for Combobox Items
// ============================================================================

function HighlightIndicator({ layoutId }: { layoutId: string }) {
  const { highlighted } = useComboboxItemContext()

  if (!highlighted) return null

  return (
    <motion.div
      layoutId={layoutId}
      className="absolute inset-0 rounded-lg bg-neutral-200"
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
      }}
    />
  )
}

// ============================================================================
// Custom Input with Styleable Caret
// ============================================================================

interface CaretState {
  /** Whether the caret was recently moved (for blink animation) */
  active: boolean
  /** Whether text is currently selected (selection mode) */
  selecting: boolean
  /** Position of this caret in the selection ('start' or 'end'), only meaningful when selecting */
  position: 'start' | 'end'
}

interface CustomCaretInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  caret?: React.ReactNode | ((state: CaretState) => React.ReactNode)
  containerClassName?: string
  activeTimeout?: number
}

const CustomCaretInput = React.forwardRef<
  HTMLInputElement,
  CustomCaretInputProps
>(function CustomCaretInput(props, forwardedRef) {
  const {
    caret,
    containerClassName,
    className,
    style,
    activeTimeout = 500,
    ...inputProps
  } = props
  const [isFocused, setIsFocused] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const measureRef = React.useRef<HTMLSpanElement>(null)
  // Caret position (the target position for animation)
  const [caretLeft, setCaretLeft] = React.useState(0)
  // Initial position for caret animation (where it starts FROM)
  const [caretInitialLeft, setCaretInitialLeft] = React.useState<number | null>(
    null,
  )
  // Selection end caret position (only used when selecting)
  const [selectionEndLeft, setSelectionEndLeft] = React.useState(0)
  const [selecting, setSelecting] = React.useState(false)
  // Key to force remount of caret when we need to change initial position
  const [caretKey, setCaretKey] = React.useState(0)
  // Track previous selection state to detect collapse direction
  const prevSelectionRef = React.useRef<{
    start: number
    end: number
    startLeft: number
    endLeft: number
    selecting: boolean
  }>({ start: 0, end: 0, startLeft: 0, endLeft: 0, selecting: false })
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const mergedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  const markActive = React.useCallback(() => {
    setIsActive(true)
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current)
    }
    activeTimeoutRef.current = setTimeout(() => {
      setIsActive(false)
    }, activeTimeout)
  }, [activeTimeout])

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current)
      }
    }
  }, [])

  const measureTextWidth = React.useCallback((text: string) => {
    const input = inputRef.current
    const measure = measureRef.current
    if (!input || !measure) return 0

    measure.textContent = text || '\u200b'
    const computedStyle = window.getComputedStyle(input)
    measure.style.font = computedStyle.font
    measure.style.letterSpacing = computedStyle.letterSpacing

    return measure.offsetWidth
  }, [])

  const updateCaretPositions = React.useCallback(() => {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const isSelecting = start !== end
    const prev = prevSelectionRef.current

    // Calculate positions
    const startLeft = measureTextWidth(input.value.substring(0, start))
    const endLeft = measureTextWidth(input.value.substring(0, end))

    // Detect if selection just collapsed
    const selectionJustCollapsed = prev.selecting && !isSelecting

    if (selectionJustCollapsed) {
      // Selection collapsed - determine which end the cursor went to
      const cursorAtEnd = start === prev.end

      if (cursorAtEnd) {
        // Cursor moved to end (pressed Right) - animate FROM start TO end
        setCaretInitialLeft(prev.startLeft)
        setCaretLeft(endLeft)
        setCaretKey((k) => k + 1)
      } else {
        // Cursor moved to start (pressed Left) - animate FROM end TO start
        setCaretInitialLeft(prev.endLeft)
        setCaretLeft(startLeft)
        setCaretKey((k) => k + 1)
      }
    } else if (isSelecting) {
      // Active selection - caret at start, selection end caret at end
      setCaretInitialLeft(null)
      setCaretLeft(startLeft)
      setSelectionEndLeft(endLeft)
    } else {
      // No selection, just cursor movement
      setCaretInitialLeft(null)
      setCaretLeft(startLeft)
    }

    setSelecting(isSelecting)

    // Update prev ref with positions
    prevSelectionRef.current = {
      start,
      end,
      startLeft,
      endLeft,
      selecting: isSelecting,
    }

    markActive()
  }, [markActive, measureTextWidth])

  React.useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const handleSelectionChange = () => {
      if (document.activeElement === input) {
        updateCaretPositions()
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateCaretPositions])

  const _valueFromProps = inputProps.value
  React.useEffect(() => {
    requestAnimationFrame(() => {
      updateCaretPositions()
    })
  }, [updateCaretPositions])

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      updateCaretPositions()
      props.onFocus?.(e)
    },
    [props.onFocus, updateCaretPositions],
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setIsActive(false)
      setSelecting(false)
      props.onBlur?.(e)
    },
    [props.onBlur],
  )

  const handleInput = React.useCallback(() => {
    updateCaretPositions()
    markActive()
  }, [updateCaretPositions, markActive])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        markActive()
      }
      props.onKeyDown?.(e)
    },
    [markActive, props.onKeyDown],
  )

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      updateCaretPositions()
      markActive()
      inputProps.onClick?.(e)
    },
    [updateCaretPositions, markActive, inputProps.onClick],
  )

  const defaultCaret = (state: CaretState) => {
    // When selecting, carets stay solid (no blinking)
    // When not selecting, caret blinks when inactive
    const shouldBlink = !state.selecting && !state.active

    return (
      <motion.div
        className={cn(
          'w-[2px] h-[1.2em] rounded-full',
          state.selecting ? 'bg-blue-500' : 'bg-current',
        )}
        animate={{ opacity: shouldBlink ? [1, 0] : 1 }}
        transition={
          shouldBlink
            ? {
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'reverse',
              }
            : { duration: 0.1 }
        }
      />
    )
  }

  const renderCaret = (position: 'start' | 'end') => {
    const state: CaretState = { active: isActive, selecting, position }
    return typeof caret === 'function'
      ? caret(state)
      : (caret ?? defaultCaret(state))
  }

  return (
    <div className={cn('relative', containerClassName)}>
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={mergedRef}
        {...inputProps}
        className={cn('caret-transparent', className)}
        style={style}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
      {isFocused && (
        <>
          {/* Primary caret - animates to cursor position */}
          <motion.div
            key={caretKey}
            className="absolute top-1/2 pointer-events-none"
            style={{ y: '-50%' }}
            initial={{ x: caretInitialLeft ?? caretLeft }}
            animate={{ x: caretLeft }}
            transition={{
              type: 'spring',
              stiffness: 800,
              damping: 40,
            }}
          >
            {renderCaret('start')}
          </motion.div>
          {/* Selection end caret - shown when selecting, fades out when selection collapses */}
          <AnimatePresence>
            {selecting && (
              <motion.div
                className="absolute top-1/2 pointer-events-none"
                style={{ y: '-50%' }}
                initial={{ opacity: 0, scale: 0.8, x: selectionEndLeft }}
                animate={{ opacity: 1, scale: 1, x: selectionEndLeft }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 800,
                  damping: 40,
                }}
              >
                {renderCaret('end')}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
})

// ============================================================================
// Types
// ============================================================================

interface DemoConfig {
  id: string
  title: string
  description: string
  component: string
}

interface ComponentSection {
  id: string
  title: string
  demos: DemoConfig[]
}

// ============================================================================
// Demo Registry
// ============================================================================

const COMPONENTS: ComponentSection[] = [
  {
    id: 'dropdown-menu',
    title: 'DropdownMenu',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Simple dropdown menu',
        component: 'DropdownMenu',
      },
      {
        id: 'with-search',
        title: 'With Search',
        description: 'Searchable dropdown with filtering',
        component: 'DropdownMenu',
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'Items with keyboard shortcuts',
        component: 'DropdownMenu',
      },
      {
        id: 'radio-group',
        title: 'Radio Group',
        description: 'Single selection with radio items',
        component: 'DropdownMenu',
      },
      {
        id: 'checkbox-items',
        title: 'Checkbox Items',
        description: 'Toggle options with checkboxes',
        component: 'DropdownMenu',
      },
      {
        id: 'submenus',
        title: 'Submenus',
        description: 'Nested submenu navigation',
        component: 'DropdownMenu',
      },
      {
        id: 'deep-search-simulated',
        title: 'Deep Search (Simulated)',
        description: 'Manual deep search with primitives',
        component: 'DropdownMenu',
      },
      {
        id: 'deep-search',
        title: 'Deep Search',
        description: 'Data-first deep search API',
        component: 'DropdownMenu',
      },
      {
        id: 'deep-search-groups',
        title: 'Deep Search - Groups',
        description: 'Groups with custom rendering at multiple depths',
        component: 'DropdownMenu',
      },
      {
        id: 'deep-search-stateful',
        title: 'Deep Search - Stateful',
        description:
          'Uses stateful components like checkbox items and radio group + radio items',
        component: 'DropdownMenu',
      },
      {
        id: 'virtualized',
        title: 'Virtualized',
        description: 'Virtualized list with 10k+ items',
        component: 'DropdownMenu',
      },
    ],
  },
  {
    id: 'context-menu',
    title: 'ContextMenu',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Right-click context menu',
        component: 'ContextMenu',
      },
      {
        id: 'with-submenus',
        title: 'With Submenus',
        description: 'Nested context menu',
        component: 'ContextMenu',
      },
    ],
  },
  {
    id: 'select',
    title: 'Select',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Single select dropdown',
        component: 'Select',
      },
      {
        id: 'multi',
        title: 'Multi Select',
        description: 'Multiple selection',
        component: 'Select',
      },
      {
        id: 'searchable',
        title: 'Searchable',
        description: 'With search filtering',
        component: 'Select',
      },
      {
        id: 'grouped',
        title: 'Grouped',
        description: 'Grouped options',
        component: 'Select',
      },
    ],
  },
  {
    id: 'combobox',
    title: 'Combobox',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Input-based select',
        component: 'Combobox',
      },
      {
        id: 'input-embedded',
        title: 'Input Embedded',
        description: 'macOS-style popup',
        component: 'Combobox',
      },
      {
        id: 'multi',
        title: 'Multi Select',
        description: 'Multiple selection',
        component: 'Combobox',
      },
      {
        id: 'virtualized',
        title: 'Virtualized',
        description: 'Large list virtualization',
        component: 'Combobox',
      },
    ],
  },
]

// ============================================================================
// Context for active demo
// ============================================================================

interface PlaygroundContextValue {
  activeDemo: string | null
  setActiveDemo: (id: string | null) => void
  configContent: React.ReactNode
  setConfigContent: (content: React.ReactNode) => void
}

const PlaygroundContext = React.createContext<PlaygroundContextValue | null>(
  null,
)

function usePlayground() {
  const context = React.useContext(PlaygroundContext)
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider')
  }
  return context
}

// ============================================================================
// TOC Sidebar
// ============================================================================

function TOCSidebar() {
  const { activeDemo } = usePlayground()

  const scrollToDemo = (demoId: string) => {
    const element = document.getElementById(demoId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Get the active component section from the activeDemo
  const activeSection = activeDemo?.split('-').slice(0, -1).join('-')

  return (
    <aside className="fixed top-20 left-4 w-52 max-h-[calc(100vh-6rem)] rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg overflow-hidden z-40">
      <div className="bg-background border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Components</h2>
      </div>
      <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
        {COMPONENTS.map((section) => {
          const isActiveSection =
            activeSection === section.id || activeDemo?.startsWith(section.id)

          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() =>
                  scrollToDemo(`${section.id}-${section.demos[0]?.id}`)
                }
                className={cn(
                  'text-sm font-medium transition-colors flex items-center gap-2 text-left',
                  isActiveSection
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary',
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    isActiveSection ? 'bg-primary' : 'bg-primary/30',
                  )}
                />
                {section.title}
              </button>
              <ul className="mt-1.5 space-y-0.5 ml-4 border-l border-border/50">
                {section.demos.map((demo) => {
                  const demoId = `${section.id}-${demo.id}`
                  const isActive = activeDemo === demoId
                  return (
                    <li key={demo.id}>
                      <button
                        type="button"
                        onClick={() => scrollToDemo(demoId)}
                        className={cn(
                          'block w-full text-left text-xs py-1 pl-3 transition-all border-l-2 -ml-px rounded-r',
                          isActive
                            ? 'text-primary font-medium border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border',
                        )}
                      >
                        {demo.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

// ============================================================================
// Floating Config Panel
// ============================================================================

interface ConfigSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function ConfigSection({
  title,
  defaultOpen = true,
  children,
}: ConfigSectionProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className="border-b border-border last:border-b-0"
    >
      <Collapsible.Trigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors group">
        <span>{title}</span>
        <ChevronIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0 transition-[height] duration-200">
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function FloatingConfigPanel() {
  const { configContent, activeDemo } = usePlayground()

  return (
    <aside
      data-config-panel
      className="fixed top-20 right-4 w-72 max-h-[calc(100vh-6rem)] rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg overflow-hidden z-40"
    >
      <div className="bg-background border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Configuration</h3>
        {activeDemo && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activeDemo
              .replace(/-/g, ' > ')
              .replace(/(\b\w)/g, (c) => c.toUpperCase())}
          </p>
        )}
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
        {!activeDemo ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Scroll to a demo to see configuration options
          </div>
        ) : configContent ? (
          configContent
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No configuration options
          </div>
        )}
      </div>
    </aside>
  )
}

// ============================================================================
// Config Controls
// ============================================================================

interface ConfigRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

export function ConfigRow({ label, description, children }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'w-20 rounded-md border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    />
  )
}

// ============================================================================
// Demo Section Component (Full Screen)
// ============================================================================

interface DemoSectionProps {
  id: string
  title: string
  description: string
  component: string
  children: React.ReactNode
  config?: React.ReactNode
}

function DemoSection({ id, children, config }: DemoSectionProps) {
  const { setActiveDemo, setConfigContent } = usePlayground()
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveDemo(id)
            setConfigContent(config || null)
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [id, config, setActiveDemo, setConfigContent])

  return (
    <section
      ref={ref}
      id={id}
      className="h-screen w-full snap-start snap-always flex items-center justify-center"
    >
      {children}
    </section>
  )
}

// ============================================================================
// Main Playground Area
// ============================================================================

const SCROLL_STORAGE_KEY = 'menu-playground-scroll'

function MainPlayground() {
  const scrollRef = React.useRef<HTMLElement>(null)

  // Save scroll position on scroll (debounced)
  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    let timeoutId: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(element.scrollTop))
      }, 100)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(timeoutId)
      element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Restore scroll position on mount (for HMR)
  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY)
    if (saved) {
      const scrollTop = Number.parseInt(saved, 10)
      // Use requestAnimationFrame to ensure layout is ready
      requestAnimationFrame(() => {
        element.scrollTop = scrollTop
      })
    }
  }, [])

  return (
    <main
      ref={scrollRef}
      className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {/* DropdownMenu Demos */}
      <BasicDropdownDemo />
      <SearchableDropdownDemo />
      <KeyboardShortcutsDemo />
      <RadioGroupDemo />
      <CheckboxItemsDemo />
      <SubmenusDemo />
      <DeepSearchSimulatedDemo />
      <DeepSearchDemo />
      <DeepSearchGroupsDemo />
      <DeepSearchStatefulDemo />

      {/* ContextMenu Demos */}
      <BasicContextMenuDemo />

      {/* Select Demos */}
      <BasicSelectDemo />
      <MultiSelectDemo />

      {/* Combobox Demos */}
      <BasicComboboxDemo />
      <InputEmbeddedComboboxDemo />
      <MultiComboboxDemo />
      <VirtualizedComboboxDemo />
    </main>
  )
}

// ============================================================================
// Demo Components (stubs - we'll add real implementations)
// ============================================================================

import { Combobox } from '@bazza-ui/react/combobox'
import { ContextMenu } from '@bazza-ui/react/context-menu'
import { DropdownMenu } from '@bazza-ui/react/dropdown-menu'
import { Select as SelectPrimitive } from '@bazza-ui/react/select'

// --- Basic Dropdown Demo ---

function BasicDropdownDemo() {
  const [closeOnClick, setCloseOnClick] = React.useState(true)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const config = (
    <>
      <ConfigSection title="Behavior">
        <ConfigRow label="closeOnClick" description="Close when item clicked">
          <Toggle checked={closeOnClick} onChange={setCloseOnClick} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-basic"
      title="Basic"
      description="Simple dropdown menu with items"
      component="DropdownMenu"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Profile')}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Settings')}
                  >
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
                    onSelect={() => toast('Logout')}
                  >
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Searchable Dropdown Demo ---

function SearchableDropdownDemo() {
  const [loop, setLoop] = React.useState(true)
  const [autoHighlightFirst, setAutoHighlightFirst] = React.useState(true)
  const [filterEnabled, setFilterEnabled] = React.useState(true)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const fruits = React.useMemo(
    () => [
      { value: 'apple', label: 'Apple', keywords: ['fruit', 'red'] },
      { value: 'banana', label: 'Banana', keywords: ['fruit', 'yellow'] },
      { value: 'cherry', label: 'Cherry', keywords: ['fruit', 'red'] },
      { value: 'dragonfruit', label: 'Dragon Fruit', keywords: ['exotic'] },
      { value: 'elderberry', label: 'Elderberry', keywords: ['berry'] },
      { value: 'fig', label: 'Fig', keywords: ['mediterranean'] },
      { value: 'grape', label: 'Grape', keywords: ['wine'] },
      { value: 'honeydew', label: 'Honeydew', keywords: ['melon'] },
    ],
    [],
  )

  const config = (
    <>
      <ConfigSection title="Surface Props">
        <ConfigRow label="loop" description="Loop navigation">
          <Toggle checked={loop} onChange={setLoop} />
        </ConfigRow>
        <ConfigRow
          label="autoHighlightFirst"
          description="Highlight first on open"
        >
          <Toggle
            checked={autoHighlightFirst}
            onChange={setAutoHighlightFirst}
          />
        </ConfigRow>
        <ConfigRow label="filter" description="Enable fuzzy filtering">
          <Toggle checked={filterEnabled} onChange={setFilterEnabled} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-with-search"
      component="DropdownMenu"
      title="With Search"
      description="Dropdown with search input and fuzzy filtering"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Select Fruit
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface
                loop={loop}
                autoHighlightFirst={autoHighlightFirst}
                filter={filterEnabled ? undefined : false}
              >
                <div className="border-b border-border p-2">
                  <DropdownMenu.Input
                    placeholder="Search fruits..."
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <DropdownMenu.List className="max-h-[200px] overflow-y-auto p-1 focus:outline-none scroll-py-1">
                  {fruits.map((fruit) => (
                    <DropdownMenu.Item
                      key={fruit.value}
                      value={fruit.value}
                      keywords={fruit.keywords}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                      onSelect={() => toast(`Selected: ${fruit.label}`)}
                    >
                      {fruit.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
                <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No fruits found
                </DropdownMenu.Empty>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Keyboard Shortcuts Demo ---

function KeyboardShortcutsDemo() {
  const [status, setStatus] = React.useState('backlog')

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const statuses = [
    { value: 'icebox', label: 'Icebox', shortcut: '1' },
    { value: 'backlog', label: 'Backlog', shortcut: '2' },
    { value: 'todo', label: 'Todo', shortcut: '3' },
    { value: 'inprogress', label: 'In Progress', shortcut: '4' },
    { value: 'done', label: 'Done', shortcut: '5' },
  ]

  const config = (
    <>
      <ConfigSection title="Current State">
        <ConfigRow label="status" description="Currently selected">
          <span className="text-sm font-medium">{status}</span>
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="How It Works" defaultOpen={false}>
        <p className="text-xs text-muted-foreground">
          Press number keys 1-5 while the menu is open to quickly select a
          status.
        </p>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-keyboard-shortcuts"
      component="DropdownMenu"
      title="Keyboard Shortcuts"
      description="Press number keys (1-5) to quickly select when menu is open"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Status: {statuses.find((s) => s.value === status)?.label}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  {statuses.map((s) => (
                    <DropdownMenu.Item
                      key={s.value}
                      shortcut={s.shortcut}
                      className="flex gap-2 cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                      onSelect={() => {
                        setStatus(s.value)
                        toast(`Status: ${s.label}`)
                      }}
                    >
                      <span className="flex flex-1 items-center gap-2">
                        <span>{s.label}</span>
                        {status === s.value && (
                          <CheckIcon className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </span>
                      <DropdownMenu.Shortcut className="text-xs text-muted-foreground" />
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Radio Group Demo ---

function RadioGroupDemo() {
  const [sortBy, setSortBy] = React.useState('name')

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const config = (
    <>
      <ConfigSection title="Radio Selection">
        <ConfigRow label="value" description="Current selected value">
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'date', label: 'Date' },
              { value: 'size', label: 'Size' },
            ]}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-radio-group"
      component="DropdownMenu"
      title="Radio Group"
      description="Single selection with radio items"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Sort by: {sortBy}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[160px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.RadioGroup
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    {(['name', 'date', 'size'] as const).map((val) => (
                      <DropdownMenu.RadioItem
                        key={val}
                        value={val}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm capitalize data-[highlighted]:bg-accent"
                      >
                        <span>{val}</span>
                        <DropdownMenu.RadioItemIndicator className="h-4 w-4">
                          <CheckIcon className="h-4 w-4 text-primary" />
                        </DropdownMenu.RadioItemIndicator>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Checkbox Items Demo ---

function CheckboxItemsDemo() {
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)
  const [autoSave, setAutoSave] = React.useState(true)
  const [closeOnClick, setCloseOnClick] = React.useState(false)
  const [useStyledCheckbox, setUseStyledCheckbox] = React.useState(false)

  // When styled checkbox is enabled, force closeOnClick to true
  // This creates the pattern: clicking checkbox box = toggle only, clicking item = toggle + close
  const effectiveCloseOnClick = useStyledCheckbox ? true : closeOnClick

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  // Simple checkmark indicator (just shows checkmark when checked)
  const SimpleCheckboxIndicator = () => (
    <DropdownMenu.CheckboxItemIndicator className="h-4 w-4">
      <CheckIcon className="h-4 w-4 text-primary" />
    </DropdownMenu.CheckboxItemIndicator>
  )

  const config = (
    <>
      <ConfigSection title="Checkbox State">
        <ConfigRow label="notifications">
          <Toggle checked={notifications} onChange={setNotifications} />
        </ConfigRow>
        <ConfigRow label="darkMode">
          <Toggle checked={darkMode} onChange={setDarkMode} />
        </ConfigRow>
        <ConfigRow label="autoSave">
          <Toggle checked={autoSave} onChange={setAutoSave} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Behavior">
        <ConfigRow
          label="closeOnClick"
          description={
            useStyledCheckbox
              ? 'Forced on: click checkbox = toggle, click item = toggle + close'
              : 'Close menu when checkbox is clicked'
          }
        >
          <Toggle
            checked={effectiveCloseOnClick}
            onChange={setCloseOnClick}
            disabled={useStyledCheckbox}
          />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Styling">
        <ConfigRow
          label="Custom checkbox"
          description="Use styled checkbox box indicator"
        >
          <Toggle checked={useStyledCheckbox} onChange={setUseStyledCheckbox} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-checkbox-items"
      component="DropdownMenu"
      title="Checkbox Items"
      description="Toggle multiple options with checkboxes"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Settings
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.CheckboxItem
                    checked={notifications}
                    onCheckedChange={setNotifications}
                    closeOnClick={effectiveCloseOnClick}
                    className={cn(
                      'group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent',
                      useStyledCheckbox ? 'gap-2' : 'justify-between',
                    )}
                  >
                    {useStyledCheckbox && (
                      <DropdownMenu.CheckboxItemIndicator
                        keepMounted
                        render={(_props, state) => (
                          <Checkbox
                            checked={state.checked}
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              state.toggle()
                            }}
                          />
                        )}
                      />
                    )}
                    <span>Notifications</span>
                    {!useStyledCheckbox && <SimpleCheckboxIndicator />}
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    closeOnClick={effectiveCloseOnClick}
                    className={cn(
                      'group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent',
                      useStyledCheckbox ? 'gap-2' : 'justify-between',
                    )}
                  >
                    {useStyledCheckbox && (
                      <DropdownMenu.CheckboxItemIndicator
                        keepMounted
                        render={(_props, state) => (
                          <Checkbox
                            checked={state.checked}
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              state.toggle()
                            }}
                          />
                        )}
                      />
                    )}
                    <span>Dark Mode</span>
                    {!useStyledCheckbox && <SimpleCheckboxIndicator />}
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                    closeOnClick={effectiveCloseOnClick}
                    className={cn(
                      'group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent',
                      useStyledCheckbox ? 'gap-2' : 'justify-between',
                    )}
                  >
                    {useStyledCheckbox && (
                      <DropdownMenu.CheckboxItemIndicator
                        keepMounted
                        render={(_props, state) => (
                          <Checkbox
                            checked={state.checked}
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              state.toggle()
                            }}
                          />
                        )}
                      />
                    )}
                    <span>Auto Save</span>
                    {!useStyledCheckbox && <SimpleCheckboxIndicator />}
                  </DropdownMenu.CheckboxItem>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Submenus Demo ---

function SubmenusDemo() {
  const [closeRootOnEsc, setCloseRootOnEsc] = React.useState(true)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const config = (
    <>
      <ConfigSection title="Submenu Props">
        <ConfigRow
          label="closeRootOnEsc"
          description="Escape closes entire tree"
        >
          <Toggle checked={closeRootOnEsc} onChange={setCloseRootOnEsc} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-submenus"
      component="DropdownMenu"
      title="Submenus"
      description="Nested submenu navigation"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          File Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('New File')}
                  >
                    New File
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Open')}
                  >
                    Open
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Submenu closeRootOnEsc={closeRootOnEsc}>
                    <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent">
                      <span>Share</span>
                      <CaretRightIcon className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner sideOffset={4}>
                        <DropdownMenu.Popup className="min-w-[140px] rounded-lg border border-border bg-popover shadow-lg">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List className="p-1 focus:outline-none">
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Email')}
                              >
                                Email
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Slack')}
                              >
                                Slack
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Copy Link')}
                              >
                                Copy Link
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
                    onSelect={() => toast('Delete')}
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Deep Search (Simulated) Demo ---
// This demo manually implements deep search using the standard submenu primitives.
// When searching, it shows results from nested submenus with breadcrumbs.
// For the real data-first deep search API, see DeepSearchRealDemo below.

import { commandScore } from '@bazza-ui/react/dropdown-menu'
import {
  ArrowUpDownIcon,
  BellIcon,
  BugIcon,
  ClipboardIcon,
  CopyIcon,
  FileIcon,
  FlaskConicalIcon,
  FolderIcon,
  GlobeIcon,
  HelpCircleIcon,
  KeyIcon,
  LayoutIcon,
  LockIcon,
  PaletteIcon,
  ScissorsIcon,
  SettingsIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
  TypeIcon,
  WebhookIcon,
  WrenchIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// Label data with colors
const LABEL_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

// Status icons (simplified from Linear example)
const StatusIcon = () => (
  <svg className="size-3.5 fill-muted-foreground" viewBox="0 0 14 14">
    <circle
      cx="7"
      cy="7"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="1.4 1.74"
    />
  </svg>
)

const AssigneeIcon = () => (
  <svg className="size-3.5 fill-muted-foreground" viewBox="0 0 16 16">
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
  </svg>
)

const PriorityIcon = () => (
  <svg className="size-3.5 fill-muted-foreground" viewBox="0 0 16 16">
    <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6Zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z" />
  </svg>
)

const LabelsIcon = () => <TagIcon className="size-3.5 text-muted-foreground" />

// Label dot component
const LabelDot = ({ color }: { color: string }) => (
  <div
    className={cn(
      'rounded-full size-2.5',
      LABEL_COLORS[color] || 'bg-gray-500',
    )}
  />
)

// All labels data
const labelsData = [
  { id: 'bug', label: 'Bug', color: 'red' },
  { id: 'enhancement', label: 'Enhancement', color: 'green' },
  { id: 'task', label: 'Task', color: 'blue' },
  { id: 'urgent', label: 'Urgent', color: 'pink' },
  { id: 'frontend', label: 'Frontend', color: 'orange' },
  { id: 'backend', label: 'Backend', color: 'teal' },
  { id: 'database', label: 'Database', color: 'violet' },
  { id: 'api', label: 'API', color: 'red' },
  { id: 'documentation', label: 'Documentation', color: 'amber' },
  { id: 'testing', label: 'Testing', color: 'yellow' },
  { id: 'performance', label: 'Performance', color: 'lime' },
  { id: 'security', label: 'Security', color: 'cyan' },
  { id: 'refactor', label: 'Refactor', color: 'indigo' },
  { id: 'feature', label: 'Feature Request', color: 'purple' },
  { id: 'hotfix', label: 'Hotfix', color: 'red' },
]

// Item definition for deep search
interface SearchableItem {
  id: string
  label: string
  keywords?: string[]
  icon: React.ReactNode
  breadcrumb?: string // e.g., "Labels" for items inside Labels submenu
  onSelect: () => void
}

// Build all searchable items (flattened for deep search)
const allSearchableItems: SearchableItem[] = [
  // Root items
  {
    id: 'status',
    label: 'Status',
    icon: <StatusIcon />,
    onSelect: () => toast('Status'),
  },
  {
    id: 'assignee',
    label: 'Assignee',
    icon: <AssigneeIcon />,
    onSelect: () => toast('Assignee'),
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: <PriorityIcon />,
    onSelect: () => toast('Priority'),
  },
  // Labels submenu trigger (searchable as a category)
  {
    id: 'labels',
    label: 'Labels',
    keywords: ['label', 'tag', 'category'],
    icon: <LabelsIcon />,
    onSelect: () => {}, // Submenu trigger - doesn't select directly
  },
  // Labels (nested items)
  ...labelsData.map((label) => ({
    id: `label-${label.id}`,
    label: label.label,
    keywords: [label.label, 'label', 'tag'],
    icon: <LabelDot color={label.color} />,
    breadcrumb: 'Labels',
    onSelect: () => toast(`Added label: ${label.label}`),
  })),
]

function DeepSearchSimulatedDemo() {
  const [search, setSearch] = React.useState('')
  const [deepSearchEnabled, setDeepSearchEnabled] = React.useState(true)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
      if (!open) {
        setSearch('')
      }
    },
    [],
  )

  // Filter items for deep search results
  const deepSearchResults = React.useMemo(() => {
    if (!search || !deepSearchEnabled) return []

    // Score and filter all items
    const scored = allSearchableItems
      .map((item) => {
        const labelScore = commandScore(item.label, search)
        const keywordScores =
          item.keywords?.map((kw) => commandScore(kw, search)) || []
        const maxScore = Math.max(labelScore, ...keywordScores)
        return { item, score: maxScore }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.map(({ item }) => item)
  }, [search, deepSearchEnabled])

  const isDeepSearching = search.length > 0 && deepSearchEnabled

  // Root menu items (when not searching)
  const rootItemIds = ['status', 'assignee', 'priority', 'labels']

  // orderedItems must always be provided when filter={false}
  // It defines the order for navigation/highlighting
  const orderedItems = React.useMemo(
    () => (isDeepSearching ? deepSearchResults.map((r) => r.id) : rootItemIds),
    [isDeepSearching, deepSearchResults],
  )

  const config = (
    <>
      <ConfigSection title="Deep Search">
        <ConfigRow label="enabled" description="Search across all submenus">
          <Toggle checked={deepSearchEnabled} onChange={setDeepSearchEnabled} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="How It Works" defaultOpen={true}>
        <p className="text-xs text-muted-foreground">
          This demo shows deep search with real submenus. Try searching for
          "Bug" or "Frontend" - you'll see results from the Labels submenu with
          breadcrumbs. Click the Labels submenu to browse normally.
        </p>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-deep-search-simulated"
      component="DropdownMenu"
      title="Deep Search (Simulated)"
      description="Manual deep search with primitives"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Issue Properties
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="w-[280px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              <DropdownMenu.Surface filter={false} orderedItems={orderedItems}>
                {/* Search Input */}
                <div className="border-b border-border p-2">
                  <DropdownMenu.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {/* Deep search indicator */}
                {isDeepSearching && deepSearchResults.length > 0 && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/30">
                    Searching all menus...
                  </div>
                )}

                <DropdownMenu.List className="max-h-[300px] overflow-y-auto p-1">
                  {isDeepSearching ? (
                    // Deep search results mode
                    deepSearchResults.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No results found
                      </div>
                    ) : (
                      deepSearchResults.map((item) =>
                        // Special handling for Labels submenu trigger
                        item.id === 'labels' ? (
                          <DropdownMenu.Submenu key={item.id}>
                            <DropdownMenu.SubmenuTrigger
                              value="labels"
                              className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent w-full"
                            >
                              <span className="flex items-center justify-center size-4">
                                {item.icon}
                              </span>
                              <span className="flex-1 text-left">
                                {item.label}
                              </span>
                              <CaretRightIcon className="size-4 text-muted-foreground" />
                            </DropdownMenu.SubmenuTrigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Positioner sideOffset={4}>
                                <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                                  <DropdownMenu.Surface>
                                    <div className="border-b border-border p-2">
                                      <DropdownMenu.Input
                                        placeholder="Search labels..."
                                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                      />
                                    </div>
                                    <DropdownMenu.List className="max-h-[250px] overflow-y-auto p-1">
                                      {labelsData.map((label) => (
                                        <DropdownMenu.Item
                                          key={label.id}
                                          className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                          onSelect={() =>
                                            toast(`Added label: ${label.label}`)
                                          }
                                        >
                                          <LabelDot color={label.color} />
                                          <span className="flex-1 truncate">
                                            {label.label}
                                          </span>
                                        </DropdownMenu.Item>
                                      ))}
                                    </DropdownMenu.List>
                                  </DropdownMenu.Surface>
                                </DropdownMenu.Popup>
                              </DropdownMenu.Positioner>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Submenu>
                        ) : (
                          <DropdownMenu.Item
                            key={item.id}
                            value={item.id}
                            className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                            onSelect={item.onSelect}
                          >
                            <span className="flex items-center justify-center size-4">
                              {item.icon}
                            </span>
                            <span className="flex-1 truncate">
                              {item.breadcrumb && (
                                <span className="text-xs text-muted-foreground mr-1">
                                  {item.breadcrumb} &rsaquo;
                                </span>
                              )}
                              {item.label}
                            </span>
                          </DropdownMenu.Item>
                        ),
                      )
                    )
                  ) : (
                    // Normal browse mode with real submenus
                    <>
                      {/* Status - just an item for demo */}
                      <DropdownMenu.Item
                        value="status"
                        className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                        onSelect={() => toast('Status')}
                      >
                        <span className="flex items-center justify-center size-4">
                          <StatusIcon />
                        </span>
                        <span className="flex-1">Status</span>
                      </DropdownMenu.Item>

                      {/* Assignee - just an item for demo */}
                      <DropdownMenu.Item
                        value="assignee"
                        className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                        onSelect={() => toast('Assignee')}
                      >
                        <span className="flex items-center justify-center size-4">
                          <AssigneeIcon />
                        </span>
                        <span className="flex-1">Assignee</span>
                      </DropdownMenu.Item>

                      {/* Priority - just an item for demo */}
                      <DropdownMenu.Item
                        value="priority"
                        className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                        onSelect={() => toast('Priority')}
                      >
                        <span className="flex items-center justify-center size-4">
                          <PriorityIcon />
                        </span>
                        <span className="flex-1">Priority</span>
                      </DropdownMenu.Item>

                      {/* Labels - real submenu */}
                      <DropdownMenu.Submenu>
                        <DropdownMenu.SubmenuTrigger
                          value="labels"
                          className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent w-full"
                        >
                          <span className="flex items-center justify-center size-4">
                            <LabelsIcon />
                          </span>
                          <span className="flex-1 text-left">Labels</span>
                          <CaretRightIcon className="size-4 text-muted-foreground" />
                        </DropdownMenu.SubmenuTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Positioner sideOffset={4}>
                            <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                              <DropdownMenu.Surface>
                                <div className="border-b border-border p-2">
                                  <DropdownMenu.Input
                                    placeholder="Search labels..."
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                  />
                                </div>
                                <DropdownMenu.List className="max-h-[250px] overflow-y-auto p-1">
                                  {labelsData.map((label) => (
                                    <DropdownMenu.Item
                                      key={label.id}
                                      className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                      onSelect={() =>
                                        toast(`Added label: ${label.label}`)
                                      }
                                    >
                                      <LabelDot color={label.color} />
                                      <span className="flex-1 truncate">
                                        {label.label}
                                      </span>
                                    </DropdownMenu.Item>
                                  ))}
                                </DropdownMenu.List>
                              </DropdownMenu.Surface>
                            </DropdownMenu.Popup>
                          </DropdownMenu.Positioner>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Submenu>
                    </>
                  )}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Deep Search Demo (Real Data-First API) ---
// This demo uses the real Surface/List/Input components
// which provide automatic deep search across nested submenus.
// It mirrors the Linear example exactly.

import type {
  BreadcrumbNode,
  GroupDef,
  GroupRenderParams,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AssigneeIcon as LinearAssigneeIcon,
  LabelsIcon as LinearLabelsIcon,
  StatusIcon as LinearStatusIcon,
  ProjectLeadIcon,
  ProjectPriority,
  ProjectPriorityIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  ProjectStatusType,
  ProjectStatusTypeIcon,
  Status,
} from './icons'

// Label color styles (from Linear example)
const DEEP_SEARCH_LABEL_STYLES: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
}

// Label data (from Linear example)
const deepSearchLabelNodes = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bug', color: 'red' },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Enhancement',
    color: 'green',
  },
  { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Task', color: 'blue' },
  { id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', name: 'Urgent', color: 'pink' },
  {
    id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
    name: 'Low Priority',
    color: 'lime',
  },
  {
    id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
    name: 'Frontend',
    color: 'orange',
  },
  {
    id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
    name: 'Backend',
    color: 'teal',
  },
  {
    id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
    name: 'Database',
    color: 'violet',
  },
  { id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8', name: 'API', color: 'red' },
  {
    id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Model',
    color: 'cyan',
  },
  {
    id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Pipeline',
    color: 'amber',
  },
  {
    id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Inference',
    color: 'emerald',
  },
  {
    id: '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Integration',
    color: 'purple',
  },
  {
    id: '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Ethics',
    color: 'fuchsia',
  },
  {
    id: '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Refactor',
    color: 'lime',
  },
  {
    id: '6ba7b81e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Performance',
    color: 'red',
  },
  {
    id: '6ba7b81f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Security',
    color: 'sky',
  },
  {
    id: '6ba7b820-9dad-11d1-80b4-00c04fd430c8',
    name: 'Testing',
    color: 'yellow',
  },
  {
    id: '6ba7b821-9dad-11d1-80b4-00c04fd430c8',
    name: 'Documentation',
    color: 'rose',
  },
]

// Project label data
const deepSearchProjectLabelNodes = [
  { id: 'pl-1', name: 'Strategic Initiative', color: 'purple' },
  { id: 'pl-2', name: 'Customer Facing', color: 'blue' },
  { id: 'pl-3', name: 'Internal Tooling', color: 'teal' },
  { id: 'pl-4', name: 'Technical Debt', color: 'orange' },
  { id: 'pl-5', name: 'Revenue Impact', color: 'green' },
  { id: 'pl-6', name: 'Cost Reduction', color: 'emerald' },
  { id: 'pl-7', name: 'Compliance', color: 'red' },
  { id: 'pl-8', name: 'Platform', color: 'indigo' },
  { id: 'pl-9', name: 'Infrastructure', color: 'violet' },
  { id: 'pl-10', name: 'Growth', color: 'lime' },
]

// Assignee data
const deepSearchAssignees = [
  {
    id: '@kianbazza',
    name: 'Kian Bazza',
    avatar: 'https://github.com/kianbazza.png',
    fallback: 'KB',
  },
  {
    id: '@shadcn',
    name: 'shadcn',
    avatar: 'https://github.com/shadcn.png',
    fallback: 'CN',
  },
  {
    id: '@rauchg',
    name: 'Guillermo Rauch',
    avatar: 'https://github.com/rauchg.png',
    fallback: 'RG',
  },
  {
    id: '@t3dotgg',
    name: 'Theo Browne',
    avatar: 'https://github.com/t3dotgg.png',
    fallback: 'TB',
  },
]

// Helper to create a submenu node
function createSubmenuNode(
  id: string,
  value: string,
  icon: React.ReactNode,
  inputPlaceholder: string,
  childNodes: NodeDef[],
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value,
    deepSearch: true,
    nodes: childNodes,
    render: ({ props, context, nodes, renderNode }: SubmenuRenderParams) => {
      // Always render as a full submenu structure (even in deep search results)
      // The only difference for deep search is showing breadcrumbs on the trigger
      return (
        <DropdownMenu.Submenu {...props}>
          <DropdownMenu.SubmenuTrigger
            value={id}
            className={cn(
              // Use group for icon compatibility with group-data-[highlighted]
              'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-4 flex items-center justify-center shrink-0">
                {icon}
              </span>
              <DeepSearchLabelWithBreadcrumbs
                label={value}
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground! transition-colors duration-50 ease-out" />
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={-2} align="list-start">
              <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <DropdownMenu.Surface>
                  <div className="border-b border-border">
                    <DropdownMenu.Input
                      placeholder={inputPlaceholder}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                    />
                  </div>
                  <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                    {nodes.map((node) => renderNode(node))}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      )
    },
  }
}

// Helper to create an item node
function createItemNode(
  id: string,
  value: string,
  icon: React.ReactNode,
  keywords?: string[],
  shortcut?: string,
): ItemDef {
  return {
    kind: 'item',
    id,
    value,
    keywords,
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        value={id}
        shortcut={shortcut}
        onSelect={() => toast(`Changed to ${value}`)}
        className={cn(
          // Use group for icon compatibility with group-data-[highlighted]
          'group group/row flex items-center gap-2 text-sm select-none w-full',
          'py-1.5 px-4 relative z-[1]',
          'data-[highlighted]:text-accent-foreground',
          'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
          'data-[highlighted]:before:bg-accent',
        )}
      >
        <span className="size-4 flex items-center justify-center shrink-0">
          {icon}
        </span>
        <DeepSearchLabelWithBreadcrumbs
          label={value}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
        {shortcut && (
          <DropdownMenu.Shortcut className="ml-auto text-xs text-muted-foreground" />
        )}
      </DropdownMenu.Item>
    ),
  }
}

// Helper for label dot
function DeepSearchLabelDot({ color }: { color: string }) {
  return (
    <div
      className={cn(
        'rounded-full size-2.5',
        DEEP_SEARCH_LABEL_STYLES[color] || 'bg-neutral-500',
      )}
    />
  )
}

// Helper for label with breadcrumbs (matches registry styling)
function DeepSearchLabelWithBreadcrumbs({
  label,
  breadcrumbs,
}: {
  label: string
  breadcrumbs?: BreadcrumbNode[]
}) {
  return (
    <div className="flex items-center gap-1 truncate min-w-0">
      {breadcrumbs?.map((crumb) => (
        <React.Fragment key={crumb.id ?? crumb.value}>
          <span className="text-muted-foreground truncate">{crumb.value}</span>
          <ChevronRightIcon className="size-3 text-muted-foreground/75 stroke-[2.5px] shrink-0" />
        </React.Fragment>
      ))}
      <span className="truncate text-primary/90 group-data-[highlighted]/row:text-primary">
        {label}
      </span>
    </div>
  )
}

// ChevronRightIcon for breadcrumbs
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Icons for notifications submenu - BellIcon, ArrowUpDownIcon imported from lucide-react

function DeepSearchDemo() {
  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  // State for checkbox items (notifications)
  const [notifSettings, setNotifSettings] = React.useState({
    enabled: true,
    sounds: true,
    badges: false,
    desktop: true,
    email: false,
  })

  // State for radio group (sort order)
  const [sortOrder, setSortOrder] = React.useState<
    'name' | 'date' | 'priority' | 'status'
  >('date')

  // Build the full menu structure matching the Linear example
  const content: NodeDef[] = React.useMemo(() => {
    // Status submenu items
    const statusItems: ItemDef[] = [
      createItemNode(
        'status-icebox',
        'Icebox',
        <Status.Icebox />,
        undefined,
        '1',
      ),
      createItemNode(
        'status-backlog',
        'Backlog',
        <Status.Backlog />,
        undefined,
        '2',
      ),
      createItemNode('status-todo', 'Todo', <Status.Todo />, undefined, '3'),
      createItemNode(
        'status-in-progress',
        'In Progress',
        <Status.InProgress />,
        undefined,
        '4',
      ),
      createItemNode('status-done', 'Done', <Status.Done />, undefined, '5'),
    ]

    // Assignee submenu items
    const assigneeItems: ItemDef[] = deepSearchAssignees.map((a) =>
      createItemNode(
        a.id,
        a.name,
        <Avatar className="size-4">
          <AvatarImage src={a.avatar} alt={a.id} />
          <AvatarFallback className="text-[10px]">{a.fallback}</AvatarFallback>
        </Avatar>,
        [a.name],
      ),
    )

    // Priority submenu items
    const priorityItems: ItemDef[] = [
      createItemNode(
        'priority-no',
        'No priority',
        <ProjectPriority.NoPriority />,
        undefined,
        '1',
      ),
      createItemNode(
        'priority-urgent',
        'Urgent',
        <ProjectPriority.Urgent />,
        undefined,
        '2',
      ),
      createItemNode(
        'priority-high',
        'High',
        <ProjectPriority.High />,
        undefined,
        '3',
      ),
      createItemNode(
        'priority-medium',
        'Medium',
        <ProjectPriority.Medium />,
        undefined,
        '4',
      ),
      createItemNode(
        'priority-low',
        'Low',
        <ProjectPriority.Low />,
        undefined,
        '5',
      ),
    ]

    // Labels submenu items
    const labelItems: ItemDef[] = deepSearchLabelNodes.map((label) => ({
      kind: 'item' as const,
      id: `label-${label.id}`,
      value: label.name,
      keywords: [label.name],
      render: ({ props, context }: ItemRenderParams) => (
        <DropdownMenu.Item
          {...props}
          // key={`label-${label.id}`}
          // value={`label-${label.id}`}
          onSelect={() => toast(`Added label: ${label.name}`)}
          className={cn(
            'group/row flex items-center gap-2 text-sm select-none w-full',
            'py-1.5 px-4 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
            <DeepSearchLabelDot color={label.color} />
          </span>
          <DeepSearchLabelWithBreadcrumbs
            label={label.name}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.Item>
      ),
    }))

    // Project Properties nested submenus
    const projectStatusItems: ItemDef[] = [
      createItemNode(
        'proj-status-failed',
        'Failed',
        <ProjectStatus.Failed />,
        undefined,
        '1',
      ),
      createItemNode(
        'proj-status-backlog',
        'Backlog',
        <ProjectStatus.Backlog />,
        undefined,
        '2',
      ),
      createItemNode(
        'proj-status-planned',
        'Planned',
        <ProjectStatus.Planned />,
        undefined,
        '3',
      ),
      createItemNode(
        'proj-status-in-progress',
        'In Progress',
        <ProjectStatus.InProgress />,
        undefined,
        '4',
      ),
      createItemNode(
        'proj-status-completed',
        'Completed',
        <ProjectStatus.Completed />,
        undefined,
        '5',
      ),
      createItemNode(
        'proj-status-canceled',
        'Canceled',
        <ProjectStatus.Canceled />,
        undefined,
        '6',
      ),
    ]

    const projectStatusTypeItems: ItemDef[] = [
      createItemNode(
        'proj-type-backlog',
        'Backlog',
        <ProjectStatusType.Backlog />,
        undefined,
        '1',
      ),
      createItemNode(
        'proj-type-planned',
        'Planned',
        <ProjectStatusType.Planned />,
        undefined,
        '2',
      ),
      createItemNode(
        'proj-type-in-progress',
        'In Progress',
        <ProjectStatusType.InProgress />,
        undefined,
        '3',
      ),
      createItemNode(
        'proj-type-completed',
        'Completed',
        <ProjectStatusType.Completed />,
        undefined,
        '4',
      ),
      createItemNode(
        'proj-type-canceled',
        'Canceled',
        <ProjectStatusType.Canceled />,
        undefined,
        '5',
      ),
    ]

    const projectPriorityItems: ItemDef[] = [
      createItemNode(
        'proj-priority-no',
        'No priority',
        <ProjectPriority.NoPriority />,
        undefined,
        '1',
      ),
      createItemNode(
        'proj-priority-urgent',
        'Urgent',
        <ProjectPriority.Urgent />,
        undefined,
        '2',
      ),
      createItemNode(
        'proj-priority-high',
        'High',
        <ProjectPriority.High />,
        undefined,
        '3',
      ),
      createItemNode(
        'proj-priority-medium',
        'Medium',
        <ProjectPriority.Medium />,
        undefined,
        '4',
      ),
      createItemNode(
        'proj-priority-low',
        'Low',
        <ProjectPriority.Low />,
        undefined,
        '5',
      ),
    ]

    const projectLabelItems: ItemDef[] = deepSearchProjectLabelNodes.map(
      (label) => ({
        kind: 'item' as const,
        id: `proj-label-${label.id}`,
        value: label.name,
        keywords: [label.name],
        render: ({ props, context }: ItemRenderParams) => (
          <DropdownMenu.Item
            {...props}
            onSelect={() => toast(`Added project label: ${label.name}`)}
            className={cn(
              'group/row flex items-center gap-2 text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
              <DeepSearchLabelDot color={label.color} />
            </span>
            <DeepSearchLabelWithBreadcrumbs
              label={label.name}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </DropdownMenu.Item>
        ),
      }),
    )

    const projectLeadItems: ItemDef[] = deepSearchAssignees.map((a) =>
      createItemNode(
        `proj-lead-${a.id}`,
        a.name,
        <Avatar className="size-4">
          <AvatarImage src={a.avatar} alt={a.id} />
          <AvatarFallback className="text-[10px]">{a.fallback}</AvatarFallback>
        </Avatar>,
        [a.name],
      ),
    )

    // Project Properties submenu (contains nested submenus)
    const projectPropertiesSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'project-properties',
      value: 'Project properties',
      deepSearch: true,
      nodes: [
        createSubmenuNode(
          'proj-status',
          'Project status',
          <ProjectStatusIcon />,
          'Project status...',
          projectStatusItems,
        ),
        createSubmenuNode(
          'proj-status-type',
          'Project status type',
          <ProjectStatusTypeIcon />,
          'Project status type...',
          projectStatusTypeItems,
        ),
        createSubmenuNode(
          'proj-priority',
          'Project priority',
          <ProjectPriorityIcon />,
          'Project priority...',
          projectPriorityItems,
        ),
        createSubmenuNode(
          'proj-labels',
          'Project labels',
          <LinearLabelsIcon />,
          'Project labels...',
          projectLabelItems,
        ),
        createSubmenuNode(
          'proj-lead',
          'Project lead',
          <ProjectLeadIcon />,
          'Project lead...',
          projectLeadItems,
        ),
      ],
      render: ({ props, context, nodes, renderNode }: SubmenuRenderParams) => {
        // Always render as a full submenu structure (even in deep search results)
        return (
          <DropdownMenu.Submenu {...props}>
            <DropdownMenu.SubmenuTrigger
              value="project-properties"
              className={cn(
                // Use group for icon compatibility with group-data-[highlighted]
                'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-4 min-h-4 min-w-4 flex items-center justify-center shrink-0">
                  <ProjectPropertiesIcon />
                </span>
                <DeepSearchLabelWithBreadcrumbs
                  label="Project properties"
                  breadcrumbs={
                    context.isDeepSearchResult ? context.breadcrumbs : undefined
                  }
                />
              </div>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground transition-colors duration-50 ease-out" />
            </DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner align="list-start" sideOffset={-2}>
                <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                  <DropdownMenu.Surface>
                    <div className="border-b border-border">
                      <DropdownMenu.Input
                        placeholder="Project properties..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                      />
                    </div>
                    <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                      {nodes.map((node) => renderNode(node))}
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        )
      },
    }

    // Notifications submenu with checkbox items
    const notificationsSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'notifications',
      value: 'Notifications',
      deepSearch: true,
      nodes: [
        {
          kind: 'item',
          id: 'notif-enabled',
          value: 'Enable notifications',
          keywords: ['notify', 'alerts', 'enable'],
          render: ({ props, context }: ItemRenderParams) => (
            <DropdownMenu.CheckboxItem
              {...props}
              checked={notifSettings.enabled}
              onCheckedChange={(checked) =>
                setNotifSettings((prev) => ({ ...prev, enabled: checked }))
              }
              className={cn(
                'group group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <DropdownMenu.CheckboxItemIndicator
                keepMounted
                render={(_props, state) => (
                  <Checkbox
                    checked={state.checked}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      state.toggle()
                    }}
                  />
                )}
              />
              <DeepSearchLabelWithBreadcrumbs
                label="Enable notifications"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </DropdownMenu.CheckboxItem>
          ),
        },
        {
          kind: 'item',
          id: 'notif-sounds',
          value: 'Sounds',
          keywords: ['audio', 'sound', 'noise'],
          render: ({ props, context }: ItemRenderParams) => (
            <DropdownMenu.CheckboxItem
              {...props}
              checked={notifSettings.sounds}
              onCheckedChange={(checked) =>
                setNotifSettings((prev) => ({ ...prev, sounds: checked }))
              }
              className={cn(
                'group group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <DropdownMenu.CheckboxItemIndicator
                keepMounted
                render={(_props, state) => (
                  <Checkbox
                    checked={state.checked}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      state.toggle()
                    }}
                  />
                )}
              />
              <DeepSearchLabelWithBreadcrumbs
                label="Sounds"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </DropdownMenu.CheckboxItem>
          ),
        },
        {
          kind: 'item',
          id: 'notif-badges',
          value: 'Badge count',
          keywords: ['badge', 'count', 'number'],
          render: ({ props, context }: ItemRenderParams) => (
            <DropdownMenu.CheckboxItem
              {...props}
              checked={notifSettings.badges}
              onCheckedChange={(checked) =>
                setNotifSettings((prev) => ({ ...prev, badges: checked }))
              }
              className={cn(
                'group group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <DropdownMenu.CheckboxItemIndicator
                keepMounted
                render={(_props, state) => (
                  <Checkbox
                    checked={state.checked}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      state.toggle()
                    }}
                  />
                )}
              />
              <DeepSearchLabelWithBreadcrumbs
                label="Badge count"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </DropdownMenu.CheckboxItem>
          ),
        },
        {
          kind: 'item',
          id: 'notif-desktop',
          value: 'Desktop notifications',
          keywords: ['desktop', 'system', 'os'],
          render: ({ props, context }: ItemRenderParams) => (
            <DropdownMenu.CheckboxItem
              {...props}
              checked={notifSettings.desktop}
              onCheckedChange={(checked) =>
                setNotifSettings((prev) => ({ ...prev, desktop: checked }))
              }
              className={cn(
                'group group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <DropdownMenu.CheckboxItemIndicator
                keepMounted
                render={(_props, state) => (
                  <Checkbox
                    checked={state.checked}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      state.toggle()
                    }}
                  />
                )}
              />
              <DeepSearchLabelWithBreadcrumbs
                label="Desktop notifications"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </DropdownMenu.CheckboxItem>
          ),
        },
        {
          kind: 'item',
          id: 'notif-email',
          value: 'Email notifications',
          keywords: ['email', 'mail', 'inbox'],
          render: ({ props, context }: ItemRenderParams) => (
            <DropdownMenu.CheckboxItem
              {...props}
              checked={notifSettings.email}
              onCheckedChange={(checked) =>
                setNotifSettings((prev) => ({ ...prev, email: checked }))
              }
              className={cn(
                'group group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-4 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <DropdownMenu.CheckboxItemIndicator
                keepMounted
                render={(_props, state) => (
                  <Checkbox
                    checked={state.checked}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation()
                      state.toggle()
                    }}
                  />
                )}
              />
              <DeepSearchLabelWithBreadcrumbs
                label="Email notifications"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </DropdownMenu.CheckboxItem>
          ),
        },
      ],
      render: ({ context, nodes, renderNode }: SubmenuRenderParams) => (
        <DropdownMenu.Submenu key="notifications">
          <DropdownMenu.SubmenuTrigger
            value="notifications"
            className={cn(
              'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-4 flex items-center justify-center shrink-0">
                <BellIcon className="size-4 fill-muted-foreground group-data-[highlighted]:fill-primary" />
              </span>
              <DeepSearchLabelWithBreadcrumbs
                label="Notifications"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground transition-colors duration-50 ease-out" />
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={-2} align="list-start">
              <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <DropdownMenu.Surface>
                  <div className="border-b border-border">
                    <DropdownMenu.Input
                      placeholder="Notifications..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                    />
                  </div>
                  <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                    {nodes.map((node) => renderNode(node))}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }

    // Sort order submenu with radio items
    // Helper to wrap radio item - when surfaced via deep search, we need to provide RadioGroup context
    const renderRadioItem = (
      id: string,
      value: typeof sortOrder,
      label: string,
      context: ItemRenderParams['context'],
      props: ItemRenderParams['props'],
    ) => {
      const radioItem = (
        <DropdownMenu.RadioItem
          {...props}
          value={value}
          className={cn(
            'group group/row flex items-center justify-between gap-2 text-sm select-none w-full',
            'py-1.5 px-4 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <DeepSearchLabelWithBreadcrumbs
            label={label}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
          <DropdownMenu.RadioItemIndicator className="size-4 flex items-center justify-center shrink-0">
            <CheckIcon className="size-3.5 text-primary" />
          </DropdownMenu.RadioItemIndicator>
        </DropdownMenu.RadioItem>
      )

      // When surfaced via deep search, wrap in RadioGroup to provide context
      if (context.isDeepSearchResult) {
        return (
          <DropdownMenu.RadioGroup
            key={id}
            value={sortOrder}
            onValueChange={(val) => {
              setSortOrder(val as typeof sortOrder)
              toast(`Sort by: ${val}`)
            }}
          >
            {radioItem}
          </DropdownMenu.RadioGroup>
        )
      }

      return radioItem
    }

    const sortOrderSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'sort-order',
      value: 'Sort by',
      deepSearch: true,
      nodes: [
        {
          kind: 'item',
          id: 'sort-name',
          value: 'Name',
          keywords: ['alphabetical', 'a-z', 'name'],
          render: ({ props, context }: ItemRenderParams) =>
            renderRadioItem('sort-name', 'name', 'Name', context, props),
        },
        {
          kind: 'item',
          id: 'sort-date',
          value: 'Date modified',
          keywords: ['date', 'time', 'modified', 'recent'],
          render: ({ props, context }: ItemRenderParams) =>
            renderRadioItem(
              'sort-date',
              'date',
              'Date modified',
              context,
              props,
            ),
        },
        {
          kind: 'item',
          id: 'sort-priority',
          value: 'Priority',
          keywords: ['priority', 'importance', 'urgent'],
          render: ({ props, context }: ItemRenderParams) =>
            renderRadioItem(
              'sort-priority',
              'priority',
              'Priority',
              context,
              props,
            ),
        },
        {
          kind: 'item',
          id: 'sort-status',
          value: 'Status',
          keywords: ['status', 'state', 'progress'],
          render: ({ props, context }: ItemRenderParams) =>
            renderRadioItem('sort-status', 'status', 'Status', context, props),
        },
      ],
      render: ({ context, nodes, renderNode }: SubmenuRenderParams) => (
        <DropdownMenu.Submenu key="sort-order">
          <DropdownMenu.SubmenuTrigger
            value="sort-order"
            className={cn(
              'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-4 flex items-center justify-center shrink-0">
                <ArrowUpDownIcon className="size-4 text-muted-foreground group-data-[highlighted]:text-primary" />
              </span>
              <DeepSearchLabelWithBreadcrumbs
                label="Sort by"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground transition-colors duration-50 ease-out" />
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={-2} align="list-start">
              <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <DropdownMenu.Surface>
                  <div className="border-b border-border">
                    <DropdownMenu.Input
                      placeholder="Sort by..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                    />
                  </div>
                  <DropdownMenu.RadioGroup
                    value={sortOrder}
                    onValueChange={(val) => {
                      setSortOrder(val as typeof sortOrder)
                      toast(`Sort by: ${val}`)
                    }}
                  >
                    <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                      {nodes.map((node) => renderNode(node))}
                    </DropdownMenu.List>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }

    // Root menu
    return [
      createSubmenuNode(
        'status',
        'Status',
        <LinearStatusIcon />,
        'Status...',
        statusItems,
      ),
      createSubmenuNode(
        'assignee',
        'Assignee',
        <LinearAssigneeIcon />,
        'Assignee...',
        assigneeItems,
      ),
      createSubmenuNode(
        'priority',
        'Priority',
        <ProjectPriorityIcon />,
        'Priority...',
        priorityItems,
      ),
      createSubmenuNode(
        'labels',
        'Labels',
        <LinearLabelsIcon />,
        'Labels...',
        labelItems,
      ),
      notificationsSubmenu,
      sortOrderSubmenu,
      projectPropertiesSubmenu,
    ]
  }, [notifSettings, sortOrder])

  const config = React.useMemo(
    () => (
      <>
        <ConfigSection title="Data-First API">
          <p className="text-xs text-muted-foreground">
            This demo mirrors the Linear example exactly using the data-first
            API. Define your menu structure as NodeDef[] with render functions.
          </p>
        </ConfigSection>
        <ConfigSection title="How It Works" defaultOpen={true}>
          <p className="text-xs text-muted-foreground">
            Type 2+ characters to activate deep search. Try "Bug", "Frontend",
            "Kian", or "Strategic" to find items across all nested submenus.
          </p>
        </ConfigSection>
        <ConfigSection title="Checkbox & Radio" defaultOpen={true}>
          <p className="text-xs text-muted-foreground">
            Try searching "sound" or "badge" to test checkbox items, or "date"
            or "priority" to test radio items surfaced via deep search.
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sort by:</span>
              <span className="font-medium">{sortOrder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notifications:</span>
              <span className="font-medium">
                {notifSettings.enabled ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </ConfigSection>
      </>
    ),
    [sortOrder, notifSettings.enabled],
  )

  return (
    <DemoSection
      id="dropdown-menu-deep-search"
      component="DropdownMenu"
      title="Deep Search"
      description="Data-first deep search API"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors -translate-x-8">
          Filter
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8} align="start">
            <DropdownMenu.Popup className="min-w-[260px] max-w-[500px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
              <DropdownMenu.Surface
                content={content}
                deepSearch={{ enabled: true, minLength: 2 }}
              >
                {/* Search Input */}
                <div className="border-b border-border">
                  <DropdownMenu.Input
                    placeholder="Filter..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                  />
                </div>

                {/* Data List */}
                <DropdownMenu.List className="max-h-[300px] overflow-y-auto py-1 scroll-py-1">
                  <PlaygroundDeepSearchItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

function PlaygroundDeepSearchItems() {
  const { nodes, renderNode, isDeepSearching, count, search } =
    DropdownMenu.useDataList()

  return (
    <>
      {isDeepSearching && count > 0 && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/30 -mt-1 mb-1">
          Searching all menus...
        </div>
      )}

      {count === 0 && search.length >= 2 ? (
        <div className="flex items-center justify-center h-10 text-muted-foreground text-sm">
          No matching options.
        </div>
      ) : (
        nodes.map((displayNode) => renderNode(displayNode))
      )}
    </>
  )
}

function PlaygroundActionItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  if (nodes.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
        No results found
      </div>
    )
  }

  return <>{nodes.map(renderNode)}</>
}

// --- Deep Search Groups Demo ---

function DeepSearchGroupsDemo() {
  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const [groupSearchBehavior, setGroupSearchBehavior] = React.useState<
    'preserve' | 'flatten'
  >('preserve')
  const [sortGroups, setSortGroups] = React.useState(true)

  // Helper to create an item node with consistent styling
  const createItem = React.useCallback(
    ({
      id,
      label,
      icon,
      keywords,
    }: {
      id: string
      label: string
      icon?: React.ReactNode
      keywords?: string[]
    }): ItemDef => ({
      kind: 'item',
      id,
      value: label,
      keywords,
      onSelect: () => toast(`Selected: ${label}`),
      render: ({ props, context }: ItemRenderParams) => (
        <DropdownMenu.Item
          {...props}
          key={id}
          value={id}
          className={cn(
            'group/row flex items-center gap-2 text-sm select-none w-full',
            'py-1.5 px-3 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:inset-x-1 before:inset-y-0 before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          {icon && (
            <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
              {icon}
            </span>
          )}
          <span className="flex-1">{label}</span>
          {context.isDeepSearchResult && context.breadcrumbs.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {context.breadcrumbs.join(' > ')}
            </span>
          )}
        </DropdownMenu.Item>
      ),
    }),
    [],
  )

  // Helper to create a group with custom rendering
  const createGroup = React.useCallback(
    ({
      id,
      label,
      nodes,
    }: {
      id: string
      label: string
      nodes: NodeDef[]
    }): GroupDef => ({
      kind: 'group',
      id,
      label,
      nodes,
      render: ({ context, children }: GroupRenderParams) => (
        <div key={id} className="py-1">
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            {context.search && (
              <span className="text-[10px] text-muted-foreground/60">
                ({context.matchCount} match
                {context.matchCount !== 1 ? 'es' : ''})
              </span>
            )}
            {context.isDeepSearchResult && context.breadcrumbs.length > 0 && (
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                in {context.breadcrumbs.join(' > ')}
              </span>
            )}
          </div>
          {children}
        </div>
      ),
    }),
    [],
  )

  // Helper to create a submenu
  const createSubmenu = React.useCallback(
    ({
      id,
      title,
      icon,
      nodes,
      inputPlaceholder,
    }: {
      id: string
      title: string
      icon: React.ReactNode
      nodes: NodeDef[]
      inputPlaceholder?: string
    }): SubmenuDef => ({
      kind: 'submenu',
      id,
      value: title,
      nodes,
      render: ({
        context,
        nodes: childNodes,
        renderNode,
      }: SubmenuRenderParams) => {
        if (context.isDeepSearchResult) {
          return null // Don't render submenu triggers when surfaced
        }
        return (
          <DropdownMenu.Submenu key={id}>
            <DropdownMenu.SubmenuTrigger
              value={id}
              className={cn(
                'group/row flex items-center gap-2 text-sm select-none w-full',
                'py-1.5 px-3 relative z-[1]',
                'data-[highlighted]:text-accent-foreground',
                'before:absolute before:inset-x-1 before:inset-y-0 before:rounded-md before:z-[-1]',
                'data-[highlighted]:before:bg-accent',
              )}
            >
              <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
                {icon}
              </span>
              <span className="flex-1">{title}</span>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground transition-colors duration-50 ease-out" />
            </DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner
                side="right"
                sideOffset={-2}
                align="list-start"
              >
                <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden *:transition-[opacity] *:ease-out *:duration-150 *:opacity-100 data-[open]:not-data-[focused]:not-data-[has-open-submenu]:*:opacity-65">
                  <DropdownMenu.Surface>
                    <DropdownMenu.Input
                      hideUntilActive
                      placeholder={
                        inputPlaceholder ?? `Search ${title.toLowerCase()}...`
                      }
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-10 px-3 border-b border-border caret-blue-500"
                    />
                    <ScrollArea.Root>
                      <ScrollArea.Viewport
                        className={cn(
                          'max-h-[300px] scroll-py-1',
                          // Gradient fade effect
                          'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
                          'before:block after:block',
                          'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
                          'before:w-full after:w-full before:z-10 after:z-10',
                          'before:overscroll-contain after:overscroll-contain',
                          'before:pointer-events-none after:pointer-events-none',
                          'before:bg-gradient-to-b before:from-popover before:to-transparent',
                          'after:bg-gradient-to-t after:from-popover after:to-transparent',
                          'before:h-[min(24px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(24px,var(--scroll-area-overflow-y-end,24px))]',
                        )}
                      >
                        <DropdownMenu.List
                          className="py-1 focus:outline-none"
                          render={<ScrollArea.Content />}
                        >
                          {childNodes.map(renderNode)}
                        </DropdownMenu.List>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar
                        orientation="vertical"
                        className="flex w-2 touch-none select-none p-0.5 transition-opacity duration-150 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 opacity-0"
                      >
                        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        )
      },
    }),
    [],
  )

  // Build menu content with groups at multiple depths
  const content: NodeDef[] = React.useMemo(() => {
    // Root level group: Quick Actions
    const quickActionsGroup = createGroup({
      id: 'quick-actions',
      label: 'Quick Actions',
      nodes: [
        createItem({
          id: 'new-file',
          label: 'New File',
          icon: <FileIcon className="h-4 w-4" />,
          keywords: ['create', 'add'],
        }),
        createItem({
          id: 'new-folder',
          label: 'New Folder',
          icon: <FolderIcon className="h-4 w-4" />,
          keywords: ['create', 'add', 'directory'],
        }),
        createItem({
          id: 'duplicate',
          label: 'Duplicate',
          icon: <CopyIcon className="h-4 w-4" />,
          keywords: ['copy', 'clone'],
        }),
      ],
    })

    // Root level group: Edit Actions
    const editActionsGroup = createGroup({
      id: 'edit-actions',
      label: 'Edit',
      nodes: [
        createItem({
          id: 'cut',
          label: 'Cut',
          icon: <ScissorsIcon className="h-4 w-4" />,
          keywords: ['remove'],
        }),
        createItem({
          id: 'copy',
          label: 'Copy',
          icon: <CopyIcon className="h-4 w-4" />,
        }),
        createItem({
          id: 'paste',
          label: 'Paste',
          icon: <ClipboardIcon className="h-4 w-4" />,
        }),
        createItem({
          id: 'delete',
          label: 'Delete',
          icon: <Trash2Icon className="h-4 w-4" />,
          keywords: ['remove', 'trash'],
        }),
      ],
    })

    // Level 2: Settings submenu with groups
    const settingsSubmenu = createSubmenu({
      id: 'settings',
      title: 'Settings',
      icon: <SettingsIcon className="h-4 w-4" />,
      nodes: [
        createGroup({
          id: 'appearance',
          label: 'Appearance',
          nodes: [
            createItem({
              id: 'theme',
              label: 'Theme',
              icon: <PaletteIcon className="h-4 w-4" />,
              keywords: ['dark', 'light', 'colors'],
            }),
            createItem({
              id: 'font-size',
              label: 'Font Size',
              icon: <TypeIcon className="h-4 w-4" />,
              keywords: ['text', 'size'],
            }),
            createItem({
              id: 'layout',
              label: 'Layout',
              icon: <LayoutIcon className="h-4 w-4" />,
              keywords: ['view', 'arrangement'],
            }),
          ],
        }),
        createGroup({
          id: 'preferences',
          label: 'Preferences',
          nodes: [
            createItem({
              id: 'notifications',
              label: 'Notifications',
              icon: <BellIcon className="h-4 w-4" />,
              keywords: ['alerts', 'sounds'],
            }),
            createItem({
              id: 'privacy',
              label: 'Privacy',
              icon: <LockIcon className="h-4 w-4" />,
              keywords: ['security', 'data'],
            }),
            createItem({
              id: 'language',
              label: 'Language',
              icon: <GlobeIcon className="h-4 w-4" />,
              keywords: ['locale', 'region'],
            }),
          ],
        }),
        // Level 3: Advanced settings submenu with groups
        createSubmenu({
          id: 'advanced',
          title: 'Advanced',
          icon: <WrenchIcon className="h-4 w-4" />,
          nodes: [
            createGroup({
              id: 'developer',
              label: 'Developer',
              nodes: [
                createItem({
                  id: 'debug-mode',
                  label: 'Debug Mode',
                  icon: <BugIcon className="h-4 w-4" />,
                  keywords: ['dev', 'console'],
                }),
                createItem({
                  id: 'api-keys',
                  label: 'API Keys',
                  icon: <KeyIcon className="h-4 w-4" />,
                  keywords: ['tokens', 'secrets'],
                }),
                createItem({
                  id: 'webhooks',
                  label: 'Webhooks',
                  icon: <WebhookIcon className="h-4 w-4" />,
                  keywords: ['integrations', 'endpoints'],
                }),
              ],
            }),
            createGroup({
              id: 'experimental',
              label: 'Experimental',
              nodes: [
                createItem({
                  id: 'beta-features',
                  label: 'Beta Features',
                  icon: <FlaskConicalIcon className="h-4 w-4" />,
                  keywords: ['new', 'preview'],
                }),
                createItem({
                  id: 'ai-assist',
                  label: 'AI Assist',
                  icon: <SparklesIcon className="h-4 w-4" />,
                  keywords: ['machine learning', 'smart'],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    // Root level ungrouped item
    const helpItem = createItem({
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircleIcon className="h-4 w-4" />,
      keywords: ['faq', 'docs', 'support'],
    })

    return [
      quickActionsGroup,
      editActionsGroup,
      { kind: 'separator' as const, id: 'separator-1' },
      settingsSubmenu,
      { kind: 'separator' as const, id: 'separator-2' },
      helpItem,
    ]
  }, [
    createGroup,
    createItem, // Level 3: Advanced settings submenu with groups
    createSubmenu,
  ])

  const config = (
    <>
      <ConfigSection title="Group Search Behavior">
        <ConfigRow
          label="groupSearchBehavior"
          description="How groups render during search (browse mode always preserves)"
        >
          <Select
            value={groupSearchBehavior}
            onChange={setGroupSearchBehavior}
            options={[
              { value: 'preserve', label: 'Preserve' },
              { value: 'flatten', label: 'Flatten' },
            ]}
          />
        </ConfigRow>
        <ConfigRow
          label="sortGroups"
          description="Sort groups by best match score"
        >
          <Toggle checked={sortGroups} onChange={setSortGroups} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Try Searching" defaultOpen={false}>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Root groups:</strong> "copy", "delete", "new"
          </p>
          <p>
            <strong>Settings groups:</strong> "theme", "notifications"
          </p>
          <p>
            <strong>Advanced groups:</strong> "debug", "beta", "ai"
          </p>
        </div>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-deep-search-groups"
      component="DropdownMenu"
      title="Deep Search - Groups"
      description="Groups with custom rendering at multiple depths (3 levels)"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[280px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              <DropdownMenu.Surface
                content={content}
                deepSearch={{
                  enabled: true,
                  groupSearchBehavior,
                  sortGroups,
                }}
              >
                <DropdownMenu.Input
                  placeholder="Search actions..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-10 px-3 border-b border-border caret-blue-500"
                />
                <ScrollArea.Root>
                  <ScrollArea.Viewport
                    className={cn(
                      'max-h-[300px] scroll-py-1',
                      // Gradient fade effect
                      'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
                      'before:block after:block',
                      'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
                      'before:w-full after:w-full before:z-10 after:z-10',
                      'before:overscroll-contain after:overscroll-contain',
                      'before:pointer-events-none after:pointer-events-none',
                      'before:bg-gradient-to-b before:from-popover before:to-transparent',
                      'after:bg-gradient-to-t after:from-popover after:to-transparent',
                      'before:h-[min(24px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(24px,var(--scroll-area-overflow-y-end,24px))]',
                    )}
                  >
                    <DropdownMenu.List
                      className="focus:outline-none py-1"
                      render={<ScrollArea.Content />}
                    >
                      <PlaygroundActionItems />
                    </DropdownMenu.List>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar
                    orientation="vertical"
                    className="flex w-2 touch-none select-none p-0.5 transition-opacity duration-150 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 opacity-0"
                  >
                    <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Deep Search Stateful Demo (CheckboxItemDef & RadioGroupDef) ---
// This demo showcases the new stateful item types for deep search:
// - CheckboxItemDef: Checkbox items with controlled state
// - RadioGroupDef: Radio groups that preserve their items together during search

import type {
  CheckboxItemDef,
  CheckboxItemRenderParams,
  RadioGroupBehavior,
  RadioGroupRenderParams,
  RadioItemDef,
  RadioItemRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { defineRadioGroup } from '@bazza-ui/react/dropdown-menu'

function DeepSearchStatefulDemo() {
  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: DropdownMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  // State for status (radio group)
  const [status, setStatus] = React.useState<string>('todo')

  // State for labels (checkboxes)
  const [selectedLabels, setSelectedLabels] = React.useState<Set<string>>(
    () => new Set(['bug']),
  )

  // State for radio group search behavior
  const [radioGroupSearchBehavior, setRadioGroupSearchBehavior] =
    React.useState<RadioGroupBehavior>('preserve')

  const toggleLabel = React.useCallback((labelId: string, checked: boolean) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(labelId)
      } else {
        next.delete(labelId)
      }
      return next
    })
  }, [])

  // Build menu content with submenus containing RadioGroupDef and CheckboxItemDef
  const content = React.useMemo((): NodeDef[] => {
    // Helper to create a radio item for status
    const createStatusRadioItem = (
      id: string,
      value: string,
      label: string,
      icon: React.ReactNode,
      keywords: string[],
    ): RadioItemDef => ({
      kind: 'radio-item',
      id,
      value,
      keywords,
      render: ({ props, context }: RadioItemRenderParams) => (
        <DropdownMenu.RadioItem
          key={id}
          id={props.id}
          value={value}
          disabled={props.disabled}
          className={cn(
            'group group/row flex items-center justify-between gap-2 text-sm select-none w-full',
            'py-1.5 px-4 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="size-4 flex items-center justify-center shrink-0">
              {icon}
            </span>
            <DeepSearchLabelWithBreadcrumbs
              label={label}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
          <DropdownMenu.RadioItemIndicator className="size-4 flex items-center justify-center shrink-0">
            <CheckIcon className="size-3.5 text-primary" />
          </DropdownMenu.RadioItemIndicator>
        </DropdownMenu.RadioItem>
      ),
    })

    // Status Radio Group - demonstrates RadioGroupDef inside a submenu
    // Radio groups are ALWAYS preserved together during deep search (never flattened)
    const statusRadioGroup = defineRadioGroup({
      kind: 'radio-group',
      id: 'status-group',
      label: 'Status',
      value: status,
      onValueChange: (value) => {
        setStatus(value)
        toast(`Status changed to: ${value}`)
      },
      nodes: [
        createStatusRadioItem(
          'status-icebox',
          'icebox',
          'Icebox',
          <Status.Icebox />,
          ['ice', 'cold', 'frozen'],
        ),
        createStatusRadioItem(
          'status-backlog',
          'backlog',
          'Backlog',
          <Status.Backlog />,
          ['queue', 'waiting', 'pending'],
        ),
        createStatusRadioItem('status-todo', 'todo', 'Todo', <Status.Todo />, [
          'to do',
          'task',
          'work',
        ]),
        createStatusRadioItem(
          'status-in-progress',
          'in-progress',
          'In Progress',
          <Status.InProgress />,
          ['working', 'active', 'doing'],
        ),
        createStatusRadioItem('status-done', 'done', 'Done', <Status.Done />, [
          'complete',
          'finished',
          'closed',
        ]),
      ],
      render: ({ props, context, children }: RadioGroupRenderParams) => (
        <DropdownMenu.RadioGroupValue
          key="status-group"
          value={props.value}
          onValueChange={props.onValueChange}
          disabled={props.disabled}
        >
          <div className="py-1">
            {context.isDeepSearchResult && (
              <div className="px-4 py-1.5 flex items-center gap-2">
                <span className="size-4 flex items-center justify-center text-muted-foreground">
                  <LinearStatusIcon />
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {context.label}
                </span>
                {context.breadcrumbs.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">
                    in {context.breadcrumbs.join(' > ')}
                  </span>
                )}
              </div>
            )}
            {children}
          </div>
        </DropdownMenu.RadioGroupValue>
      ),
    })

    // Status Submenu - contains the RadioGroupDef
    const statusSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'status',
      value: 'Status',
      deepSearch: true,
      nodes: [statusRadioGroup],
      render: ({ context, nodes, renderNode }: SubmenuRenderParams) => (
        <DropdownMenu.Submenu key="status">
          <DropdownMenu.SubmenuTrigger
            value="status"
            className={cn(
              'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-4 flex items-center justify-center shrink-0">
                <LinearStatusIcon />
              </span>
              <DeepSearchLabelWithBreadcrumbs
                label="Status"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground! transition-colors duration-50 ease-out" />
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={-2} align="list-start">
              <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <DropdownMenu.Surface>
                  <div className="border-b border-border">
                    <DropdownMenu.Input
                      placeholder="Status..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                    />
                  </div>
                  <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                    {nodes.map((node) => renderNode(node))}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }

    // Labels data
    const labelData = [
      { id: 'bug', name: 'Bug', color: 'red', keywords: ['error', 'issue'] },
      {
        id: 'enhancement',
        name: 'Enhancement',
        color: 'green',
        keywords: ['feature', 'improvement'],
      },
      { id: 'urgent', name: 'Urgent', color: 'pink', keywords: ['critical'] },
      {
        id: 'frontend',
        name: 'Frontend',
        color: 'orange',
        keywords: ['ui', 'client'],
      },
      {
        id: 'backend',
        name: 'Backend',
        color: 'teal',
        keywords: ['server', 'api'],
      },
    ]

    // Labels as CheckboxItemDef - demonstrates CheckboxItemDef inside a submenu
    const labelCheckboxItems: CheckboxItemDef[] = labelData.map((label) => ({
      kind: 'checkbox-item',
      id: `label-${label.id}`,
      value: label.name,
      keywords: label.keywords,
      checked: selectedLabels.has(label.id),
      onCheckedChange: (checked) => toggleLabel(label.id, checked),
      closeOnClick: false,
      render: ({ props, context }: CheckboxItemRenderParams) => (
        <DropdownMenu.CheckboxItem
          key={`label-${label.id}`}
          id={props.id}
          checked={props.checked}
          onCheckedChange={props.onCheckedChange}
          disabled={props.disabled}
          closeOnClick={props.closeOnClick ?? false}
          className={cn(
            'group group/row flex items-center gap-2 text-sm select-none w-full',
            'py-1.5 px-4 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <DropdownMenu.CheckboxItemIndicator
            keepMounted
            render={(_indicatorProps, state) => (
              <Checkbox
                checked={state.checked}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  state.toggle()
                }}
              />
            )}
          />
          <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
            <DeepSearchLabelDot color={label.color} />
          </span>
          <DeepSearchLabelWithBreadcrumbs
            label={label.name}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.CheckboxItem>
      ),
    }))

    // Labels Submenu - contains CheckboxItemDef items
    const labelsSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'labels',
      value: 'Labels',
      deepSearch: true,
      nodes: labelCheckboxItems,
      render: ({ context, nodes, renderNode }: SubmenuRenderParams) => (
        <DropdownMenu.Submenu key="labels">
          <DropdownMenu.SubmenuTrigger
            value="labels"
            className={cn(
              'group group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
              'py-1.5 px-4 relative z-[1]',
              'data-[highlighted]:text-accent-foreground',
              'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
              'data-[highlighted]:before:bg-accent',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-4 flex items-center justify-center shrink-0">
                <LinearLabelsIcon />
              </span>
              <DeepSearchLabelWithBreadcrumbs
                label="Labels"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground/50 group-data-[popup-open]/row:text-muted-foreground group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground! transition-colors duration-50 ease-out" />
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={-2} align="list-start">
              <DropdownMenu.Popup className="w-[220px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <DropdownMenu.Surface>
                  <div className="border-b border-border">
                    <DropdownMenu.Input
                      placeholder="Labels..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                    />
                  </div>
                  <DropdownMenu.List className="max-h-[250px] overflow-y-auto py-1">
                    {nodes.map((node) => renderNode(node))}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }

    // Assignee submenu for comparison with regular items
    const assigneeItems: ItemDef[] = deepSearchAssignees.slice(0, 2).map((a) =>
      createItemNode(
        a.id,
        a.name,
        <Avatar className="size-4">
          <AvatarImage src={a.avatar} alt={a.id} />
          <AvatarFallback className="text-[10px]">{a.fallback}</AvatarFallback>
        </Avatar>,
        [a.name],
      ),
    )

    const assigneeSubmenu = createSubmenuNode(
      'assignee',
      'Assignee',
      <LinearAssigneeIcon />,
      'Assignee...',
      assigneeItems,
    )

    return [statusSubmenu, labelsSubmenu, assigneeSubmenu]
  }, [status, selectedLabels, toggleLabel])

  const selectedLabelNames = React.useMemo(() => {
    const names: string[] = []
    for (const id of selectedLabels) {
      const found = deepSearchLabelNodes.find(
        (l) => l.id === id || l.name.toLowerCase() === id,
      )
      if (found) names.push(found.name)
      else names.push(id)
    }
    return names.length > 0 ? names.join(', ') : 'None'
  }, [selectedLabels])

  const config = React.useMemo(
    () => (
      <>
        <ConfigSection title="Radio Group Search" defaultOpen={true}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium">Behavior</span>
            <Select
              value={radioGroupSearchBehavior}
              onChange={setRadioGroupSearchBehavior}
              options={[
                { value: 'preserve', label: 'Preserve' },
                { value: 'preserve-show-all', label: 'Show All' },
                { value: 'flatten', label: 'Flatten' },
              ]}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            <strong>preserve:</strong> Only matching items shown
            <br />
            <strong>show-all:</strong> All items shown when any matches
            <br />
            <strong>flatten:</strong> Items shown individually
          </p>
        </ConfigSection>
        <ConfigSection title="Current State" defaultOpen={true}>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">
                {status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labels:</span>
              <span className="font-medium max-w-[100px] truncate">
                {selectedLabelNames}
              </span>
            </div>
          </div>
        </ConfigSection>
        <ConfigSection title="Try Searching" defaultOpen={false}>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Radio:</strong> "todo", "backlog", "done"
            </p>
            <p>
              <strong>Checkbox:</strong> "bug", "frontend"
            </p>
          </div>
        </ConfigSection>
      </>
    ),
    [status, selectedLabelNames, radioGroupSearchBehavior],
  )

  return (
    <DemoSection
      id="dropdown-menu-deep-search-stateful"
      component="DropdownMenu"
      title="Deep Search - Stateful"
      description="CheckboxItemDef & RadioGroupDef in submenus"
      config={config}
    >
      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors -translate-x-8">
          Filter (Stateful)
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8} align="start">
            <DropdownMenu.Popup className="min-w-[260px] max-w-[500px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
              <DropdownMenu.Surface
                content={content}
                deepSearch={{
                  enabled: true,
                  minLength: 2,
                  radioGroupSearchBehavior,
                }}
              >
                {/* Search Input */}
                <div className="border-b border-border">
                  <DropdownMenu.Input
                    placeholder="Filter..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus:placeholder:text-muted-foreground min-h-9 px-4 caret-blue-500"
                  />
                </div>

                {/* Data List */}
                <DropdownMenu.List className="max-h-[300px] overflow-y-auto py-1 scroll-py-1">
                  <PlaygroundDeepSearchItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Basic Context Menu Demo ---

function BasicContextMenuDemo() {
  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: ContextMenu.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const config = (
    <>
      <ConfigSection title="Usage">
        <p className="text-xs text-muted-foreground">
          Right-click on the demo area to open the context menu.
        </p>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="context-menu-basic"
      component="ContextMenu"
      title="Basic"
      description="Right-click to open context menu"
      config={config}
    >
      <ContextMenu.Root onOpenChange={handleOpenChange}>
        <ContextMenu.Trigger className="flex h-[200px] w-[300px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50">
          <div className="text-center">
            <div className="text-sm font-medium">Right-click here</div>
            <div className="text-xs text-muted-foreground">
              or long-press on touch
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <ContextMenu.Surface>
                <ContextMenu.List className="p-1 focus:outline-none">
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Cut')}
                  >
                    Cut
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Copy')}
                  >
                    Copy
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Paste')}
                  >
                    Paste
                  </ContextMenu.Item>
                  <ContextMenu.Separator className="my-1 h-px bg-border" />
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
                    onSelect={() => toast('Delete')}
                  >
                    Delete
                  </ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </DemoSection>
  )
}

// --- Basic Select Demo ---

function BasicSelectDemo() {
  const [value, setValue] = React.useState('')

  const handleOpenChange = React.useCallback(
    (
      open: boolean,
      eventDetails: SelectPrimitive.Root.OpenChangeEventDetails,
    ) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  // Positioner props
  const [alignItemWithTrigger, setAlignItemWithTrigger] = React.useState(true)
  const [side, setSide] = React.useState<'top' | 'bottom'>('bottom')
  const [align, setAlign] = React.useState<'start' | 'center' | 'end'>('start')
  const [sideOffset, setSideOffset] = React.useState(8)

  // Root props
  const [modal, setModal] = React.useState(true)
  const [disabled, setDisabled] = React.useState(false)

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'br', label: 'Brazil' },
    { value: 'in', label: 'India' },
    { value: 'mx', label: 'Mexico' },
  ]

  const countryItems = React.useMemo(
    () => Object.fromEntries(countries.map((c) => [c.value, c.label])),
    [],
  )

  const config = (
    <>
      <ConfigSection title="Value">
        <ConfigRow label="value" description="Current selection">
          <Combobox.Root
            value={value}
            onValueChange={setValue}
            items={countryItems}
          >
            <Combobox.InputWrapper className="flex h-7 w-32 items-center gap-1 rounded-md border border-border bg-background px-2">
              <Combobox.Input
                placeholder="(none)"
                className="w-full bg-transparent text-xs outline-none"
              />
              <Combobox.Clear className="text-muted-foreground hover:text-foreground">
                <CloseIcon className="h-3 w-3" />
              </Combobox.Clear>
            </Combobox.InputWrapper>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4} className="z-50">
                <Combobox.Popup className="w-40 rounded-md border border-border bg-popover shadow-md">
                  <Combobox.Surface>
                    <Combobox.List className="max-h-[200px] overflow-y-auto p-1">
                      {countries.map((country) => (
                        <Combobox.Item
                          key={country.value}
                          value={country.value}
                          textValue={country.label}
                          className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-xs data-[highlighted]:bg-accent"
                        >
                          <Combobox.ItemLabel />
                          <Combobox.ItemIndicator className="text-primary">
                            <CheckIcon className="h-3 w-3" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                    <Combobox.Empty className="px-2 py-4 text-center text-xs text-muted-foreground">
                      No countries found
                    </Combobox.Empty>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Root Props">
        <ConfigRow label="modal" description="Lock scroll & trap focus">
          <Toggle checked={modal} onChange={setModal} />
        </ConfigRow>
        <ConfigRow label="disabled" description="Disable the select">
          <Toggle checked={disabled} onChange={setDisabled} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Positioner Props">
        <ConfigRow
          label="alignItemWithTrigger"
          description="Align selected item with trigger"
        >
          <Toggle
            checked={alignItemWithTrigger}
            onChange={setAlignItemWithTrigger}
          />
        </ConfigRow>
        <ConfigRow label="side" description="Preferred side">
          <Select
            value={side}
            onChange={setSide}
            options={[
              { value: 'bottom', label: 'Bottom' },
              { value: 'top', label: 'Top' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="align" description="Alignment on side">
          <Select
            value={align}
            onChange={setAlign}
            options={[
              { value: 'start', label: 'Start' },
              { value: 'center', label: 'Center' },
              { value: 'end', label: 'End' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="sideOffset" description="Gap from trigger (px)">
          <NumberInput
            value={sideOffset}
            onChange={setSideOffset}
            min={0}
            max={32}
            step={2}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="select-basic"
      component="Select"
      title="Basic"
      description="Single select dropdown"
      config={config}
    >
      <SelectPrimitive.Root
        value={value}
        onValueChange={setValue}
        items={countryItems}
        modal={modal}
        disabled={disabled}
        onOpenChange={handleOpenChange}
      >
        <SelectPrimitive.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent/50 data-[placeholder]:text-muted-foreground data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed">
          <SelectPrimitive.Value placeholder="Select a country..." />
          {/*<SelectPrimitive.Value placeholder="Select a country...">
            {({ value, placeholder, getValueText }) =>
              value ? getValueText(value) : placeholder
            }
          </SelectPrimitive.Value>*/}
          <SelectPrimitive.Icon className="text-muted-foreground data-[popup-open]:rotate-180 transition-transform">
            <ChevronIcon className="h-4 w-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            alignItemWithTrigger={alignItemWithTrigger}
            side={side}
            align={align}
            sideOffset={sideOffset}
          >
            <SelectPrimitive.Popup className="min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <SelectPrimitive.Surface>
                <SelectPrimitive.List className="p-1 focus:outline-none">
                  {countries.map((country) => (
                    <SelectPrimitive.Item
                      key={country.value}
                      value={country.value}
                      textValue={country.label}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:font-medium"
                    >
                      <SelectPrimitive.ItemLabel />
                      <SelectPrimitive.ItemIndicator className="text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Surface>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </DemoSection>
  )
}

// --- Multi Select Demo ---

function MultiSelectDemo() {
  const [values, setValues] = React.useState<string[]>(['react'])

  const handleOpenChange = React.useCallback(
    (
      open: boolean,
      eventDetails: SelectPrimitive.Root.OpenChangeEventDetails,
    ) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ]

  const config = (
    <>
      <ConfigSection title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-xs text-muted-foreground">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="select-multi"
      component="Select"
      title="Multi Select"
      description="Select multiple values"
      config={config}
    >
      <SelectPrimitive.Root
        multiple
        values={values}
        onValuesChange={setValues}
        onOpenChange={handleOpenChange}
      >
        <SelectPrimitive.Trigger className="inline-flex min-w-[220px] items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent/50 data-[placeholder]:text-muted-foreground">
          <SelectPrimitive.Value placeholder="Select frameworks...">
            {({ values: selectedValues }) => {
              if (selectedValues.length === 0) return 'Select frameworks...'
              if (selectedValues.length <= 2) {
                return selectedValues
                  .map((v) => frameworks.find((f) => f.value === v)?.label ?? v)
                  .join(', ')
              }
              return `${selectedValues.length} selected`
            }}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon className="text-muted-foreground data-[popup-open]:rotate-180 transition-transform">
            <ChevronIcon className="h-4 w-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={8}>
            <SelectPrimitive.Popup className="min-w-[220px] rounded-lg border border-border bg-popover shadow-lg">
              <SelectPrimitive.Surface>
                <SelectPrimitive.List className="p-1 focus:outline-none">
                  {frameworks.map((fw) => (
                    <SelectPrimitive.Item
                      key={fw.value}
                      value={fw.value}
                      textValue={fw.label}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-border group-data-[selected]:border-primary group-data-[selected]:bg-primary">
                        <SelectPrimitive.ItemIndicator className="text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemLabel>
                        {fw.label}
                      </SelectPrimitive.ItemLabel>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Surface>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </DemoSection>
  )
}

// --- Basic Combobox Demo ---

function BasicComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [openOnFocus, setOpenOnFocus] = React.useState(true)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: Combobox.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
  ]

  const countryItems = React.useMemo(
    () => Object.fromEntries(countries.map((c) => [c.value, c.label])),
    [],
  )

  const config = (
    <>
      <ConfigSection title="Root Props">
        <ConfigRow label="openOnFocus" description="Open popup when focused">
          <Toggle checked={openOnFocus} onChange={setOpenOnFocus} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="value" description="Selected value">
          <span className="text-sm font-mono">{value || '(none)'}</span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-basic"
      component="Combobox"
      title="Basic"
      description="Input-based select with filtering"
      config={config}
    >
      <Combobox.Root
        value={value}
        onValueChange={setValue}
        items={countryItems}
        openOnFocus={openOnFocus}
        onOpenChange={handleOpenChange}
      >
        <div className="relative">
          <Combobox.Input
            placeholder="Search countries..."
            className="w-[250px] rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup className="w-[250px] rounded-lg border border-border bg-popover shadow-lg">
              <Combobox.Surface>
                <Combobox.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                  {countries.map((country) => (
                    <Combobox.Item
                      key={country.value}
                      value={country.value}
                      textValue={country.label}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:font-medium"
                    >
                      <Combobox.ItemLabel>{country.label}</Combobox.ItemLabel>
                      <Combobox.ItemIndicator className="text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  ))}
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No countries found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// --- Input Embedded Combobox Demo with Motion ---

export function InputEmbeddedComboboxDemo({
  withoutConfig = false,
}: {
  withoutConfig?: boolean
}) {
  const [value, setValue] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [shouldAnimateItems, setShouldAnimateItems] = React.useState(false)

  // Positioner config
  const [side, setSide] = React.useState<'top' | 'bottom'>('bottom')
  const [align, setAlign] = React.useState<'start' | 'center' | 'end'>('center')
  const [popupPadding, setPopupPadding] = React.useState(4)
  const [showScrollGradients, setShowScrollGradients] = React.useState(true)

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'pineapple', label: 'Pineapple' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'watermelon', label: 'Watermelon' },
    { value: 'kiwi', label: 'Kiwi' },
    { value: 'peach', label: 'Peach' },
    { value: 'plum', label: 'Plum' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'raspberry', label: 'Raspberry' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'coconut', label: 'Coconut' },
    { value: 'papaya', label: 'Papaya' },
    { value: 'lemon', label: 'Lemon' },
  ]

  const fruitItems = React.useMemo(
    () => Object.fromEntries(fruits.map((f) => [f.value, f.label])),
    [],
  )

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Combobox.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(nextOpen, eventDetails)) return

      if (nextOpen) {
        setShouldAnimateItems(true)
      }
      setOpen(nextOpen)
    },
    [],
  )

  const config = (
    <>
      <ConfigSection title="Positioner">
        <ConfigRow label="side" description="Preferred side">
          <Select
            value={side}
            onChange={setSide}
            options={[
              { value: 'bottom', label: 'Bottom' },
              { value: 'top', label: 'Top' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="align" description="Alignment">
          <Select
            value={align}
            onChange={setAlign}
            options={[
              { value: 'center', label: 'Center' },
              { value: 'start', label: 'Start' },
              { value: 'end', label: 'End' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="popupPadding" description="Padding (px)">
          <NumberInput
            value={popupPadding}
            onChange={setPopupPadding}
            min={0}
            max={24}
            step={2}
          />
        </ConfigRow>
        <ConfigRow label="scrollGradients" description="Fade on edges">
          <Toggle
            checked={showScrollGradients}
            onChange={setShowScrollGradients}
          />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="value" description="Selected">
          <span className="text-sm font-mono">{value || '(none)'}</span>
        </ConfigRow>
        <ConfigRow label="open" description="Popup state">
          <span className="text-sm font-mono">{open ? 'Yes' : 'No'}</span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  const component = (
    <Combobox.Root
      value={value}
      onValueChange={setValue}
      items={fruitItems}
      layout="input-embedded"
      open={open}
      onOpenChange={handleOpenChange}
      modal
    >
      <Combobox.InputWrapper className="flex h-10 w-[280px] items-center gap-2 rounded-xl bg-white px-4 shadow-xs border">
        <Combobox.Input
          placeholder="Select a fruit..."
          cursorBehavior="none"
          render={
            <CustomCaretInput
              containerClassName="flex-1"
              caret={({ active, selecting }) => {
                // When selecting, carets stay solid (no blinking)
                const shouldBlink = !selecting && !active

                return (
                  <motion.div
                    className={cn(
                      'w-[2px] h-5 rounded-full',
                      selecting ? 'bg-neutral-600' : 'bg-blue-500',
                    )}
                    animate={{ opacity: shouldBlink ? [1, 0] : 1 }}
                    transition={
                      shouldBlink
                        ? {
                            duration: 0.4,
                            repeatDelay: 0.1,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                          }
                        : { duration: 0.05 }
                    }
                  />
                )
              }}
            />
          }
          className="w-full bg-transparent text-sm outline-none placeholder:select-none"
        />
        <Combobox.Clear className="text-gray-400 hover:text-gray-600 cursor-pointer rounded p-0.5 transition-colors">
          <CloseIcon className="h-3.5 w-3.5" />
        </Combobox.Clear>
        <Combobox.Icon className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
          <AnimatedChevronsIcon open={open} className="h-4 w-4" />
        </Combobox.Icon>
      </Combobox.InputWrapper>
      <Combobox.Portal>
        <AnimatePresence>
          {open && (
            <Combobox.Positioner
              side={side}
              align={align}
              popupPadding={popupPadding}
              className="group/positioner"
            >
              <Combobox.Popup
                className="rounded-2xl shadow-lg border bg-neutral-100"
                render={
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      filter: 'blur(4px)',
                    }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  />
                }
              >
                <Combobox.Surface
                  className="group-data-[side=top]/positioner:mb-2 group-data-[side=bottom]/positioner:mt-2"
                  autoHighlightFirst="selected"
                >
                  <ScrollArea.Root className="">
                    <ScrollArea.Viewport
                      className={cn(
                        'max-h-[calc(var(--spacing)*9*7)] scroll-py-5 scroll-smooth overflow-y-scroll',
                        showScrollGradients && [
                          'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
                          'before:block after:block',
                          'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
                          'before:w-full after:w-full before:z-10 after:z-10',
                          'before:overscroll-contain after:overscroll-contain',
                          'before:pointer-events-none after:pointer-events-none',
                          'before:bg-gradient-to-b before:from-neutral-100 before:to-transparent',
                          'after:bg-gradient-to-t after:from-neutral-100 after:to-transparent',
                          'before:h-[min(30px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(30px,var(--scroll-area-overflow-y-end,30px))]',
                        ],
                      )}
                    >
                      <Combobox.List render={<ScrollArea.Content />}>
                        <AnimatePresence>
                          {fruits.map((fruit, index) => {
                            const staggerDelay = shouldAnimateItems
                              ? index * 0.02
                              : 0
                            const isSelected = value === fruit.value
                            return (
                              <Combobox.Item
                                key={fruit.value}
                                value={fruit.value}
                                textValue={fruit.label}
                                className={cn(
                                  'relative flex cursor-pointer items-center justify-between rounded-2xl px-3 h-9',
                                  'text-sm font-medium text-primary/60 data-[highlighted]:text-primary/90 transition-colors',
                                )}
                                render={
                                  <motion.div
                                    initial={
                                      shouldAnimateItems
                                        ? { opacity: 0, x: -10 }
                                        : false
                                    }
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                      transition: {
                                        duration: 0.15,
                                        delay: staggerDelay,
                                        ease: [0.4, 0, 0.2, 1],
                                      },
                                    }}
                                    onAnimationComplete={() => {
                                      if (index === fruits.length - 1) {
                                        setShouldAnimateItems(false)
                                      }
                                    }}
                                  />
                                }
                              >
                                <HighlightIndicator layoutId="combobox-highlight" />
                                <Combobox.ItemLabel className="relative z-[1]">
                                  {fruit.label}
                                </Combobox.ItemLabel>
                                {isSelected && (
                                  <motion.div className="relative z-[1] size-2 bg-blue-500 rounded-full" />
                                )}
                              </Combobox.Item>
                            )
                          })}
                        </AnimatePresence>
                      </Combobox.List>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                      orientation="vertical"
                      className="flex w-2 touch-none select-none p-0.5 transition-opacity duration-150 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 opacity-0"
                    >
                      <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral-300" />
                    </ScrollArea.Scrollbar>
                  </ScrollArea.Root>
                  <Combobox.Empty className="px-3 py-8 text-center text-sm text-neutral-500">
                    No fruits found
                  </Combobox.Empty>
                </Combobox.Surface>
              </Combobox.Popup>
            </Combobox.Positioner>
          )}
        </AnimatePresence>
      </Combobox.Portal>
    </Combobox.Root>
  )

  if (withoutConfig) return component

  return (
    <DemoSection
      id="combobox-input-embedded"
      component="Combobox"
      title="Input Embedded"
      description="macOS-style popup with motion animations"
      config={config}
    >
      <div className="rounded-2xl bg-neutral-300 size-full flex flex-col items-center justify-center">
        {component}
      </div>
    </DemoSection>
  )
}

// --- Multi Combobox Demo ---

function MultiComboboxDemo() {
  const [values, setValues] = React.useState<string[]>(['react'])
  const [closeOnSelect, setCloseOnSelect] = React.useState(false)

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: Combobox.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return
    },
    [],
  )

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
    { value: 'qwik', label: 'Qwik' },
    { value: 'preact', label: 'Preact' },
  ]

  const config = (
    <>
      <ConfigSection title="Behavior">
        <ConfigRow
          label="closeOnSelect"
          description="Close popup after selecting"
        >
          <Toggle checked={closeOnSelect} onChange={setCloseOnSelect} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-xs text-muted-foreground">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-multi"
      component="Combobox"
      title="Multi Select"
      description="Select multiple values with toggle behavior"
      config={config}
    >
      <Combobox.Root
        multiple
        values={values}
        onValuesChange={setValues}
        closeOnSelect={closeOnSelect}
        onOpenChange={handleOpenChange}
      >
        <div className="relative">
          <Combobox.Input
            placeholder="Select frameworks..."
            className="w-[280px] rounded-md border border-border bg-background px-4 py-2 pr-16 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Clear className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
            <CloseIcon className="h-4 w-4" />
          </Combobox.Clear>
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup className="w-[280px] rounded-lg border border-border bg-popover shadow-lg">
              <Combobox.Surface>
                <Combobox.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                  {frameworks.map((fw) => (
                    <Combobox.Item
                      key={fw.value}
                      value={fw.value}
                      textValue={fw.label}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-border group-data-[selected]:border-primary group-data-[selected]:bg-primary">
                        <Combobox.ItemIndicator className="text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </Combobox.ItemIndicator>
                      </span>
                      <Combobox.ItemLabel>{fw.label}</Combobox.ItemLabel>
                    </Combobox.Item>
                  ))}
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No frameworks found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// --- Virtualized Combobox Demo ---

function VirtualizedComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [inputValue, setInputValue] = React.useState('')
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const [itemCount, setItemCount] = React.useState(1000)

  // Generate items
  const allItems = React.useMemo(() => {
    const categories = ['User', 'Project', 'Task', 'Document', 'Event']
    const items: { value: string }[] = []
    for (let i = 0; i < itemCount; i++) {
      const category = categories[i % categories.length]
      items.push({
        value: `${category?.toLowerCase()}-${i + 1}`,
      })
    }
    return items
  }, [itemCount])

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (!inputValue) return allItems
    const lowerSearch = inputValue.toLowerCase()
    return allItems.filter((item) => item.value.includes(lowerSearch))
  }, [inputValue, allItems])

  const itemHeight = 36
  const listHeight = 300

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const virtualizerRef = React.useRef(virtualizer)
  virtualizerRef.current = virtualizer

  const handleHighlightChange = React.useCallback(
    (_highlightedValue: string | null, index: number) => {
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizerRef.current.scrollToIndex(index, { align: 'auto' })
        })
      }
    },
    [],
  )

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: Combobox.Root.OpenChangeEventDetails) => {
      if (shouldPreventCloseOnConfigPanel(open, eventDetails)) return

      if (!open && scrollElement) {
        scrollElement.scrollTop = 0
        setInputValue('')
      }
    },
    [scrollElement],
  )

  const config = (
    <>
      <ConfigSection title="Virtualizer Config">
        <ConfigRow label="itemCount" description="Total number of items">
          <Select
            value={String(itemCount)}
            onChange={(v) => setItemCount(Number(v))}
            options={[
              { value: '100', label: '100' },
              { value: '1000', label: '1,000' },
              { value: '10000', label: '10,000' },
              { value: '50000', label: '50,000' },
            ]}
          />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="filtered" description="Visible items">
          <span className="text-sm font-mono">
            {filteredItems.length.toLocaleString()}
          </span>
        </ConfigRow>
        <ConfigRow label="value" description="Selected value">
          <span className="text-sm font-mono truncate max-w-[100px]">
            {value || '(none)'}
          </span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-virtualized"
      component="Combobox"
      title="Virtualized"
      description="Efficiently render thousands of items"
      config={config}
    >
      <Combobox.Root
        value={value}
        onValueChange={setValue}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        virtualized
        virtualItems={filteredItems}
        onHighlightChange={handleHighlightChange}
        onOpenChange={handleOpenChange}
      >
        <div className="relative">
          <Combobox.Input
            placeholder={`Search ${itemCount.toLocaleString()} items...`}
            className="w-[300px] rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="z-50">
            <Combobox.Popup className="w-[300px] rounded-lg border border-border bg-popover shadow-lg">
              <Combobox.Surface filter={false}>
                <Combobox.List
                  ref={setScrollElement}
                  className="overflow-auto p-1 focus:outline-none scroll-py-1"
                  style={{ height: listHeight }}
                >
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const item = filteredItems[virtualRow.index]
                      if (!item) return null
                      return (
                        <Combobox.Item
                          key={item.value}
                          value={item.value}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: itemHeight,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 text-sm data-[highlighted]:bg-accent"
                        >
                          <span className="capitalize">
                            {item.value.replace('-', ' #')}
                          </span>
                          <Combobox.ItemIndicator className="text-primary">
                            <CheckIcon className="h-4 w-4" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      )
                    })}
                  </div>
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No items found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// ============================================================================
// Icons
// ============================================================================

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    role="img"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6.336 13.6a1.049 1.049 0 0 1-.8-.376L2.632 9.736a.992.992 0 0 1 .152-1.424 1.056 1.056 0 0 1 1.456.152l2.008 2.4 5.448-8a1.048 1.048 0 0 1 1.432-.288A.992.992 0 0 1 13.424 4L7.2 13.144a1.04 1.04 0 0 1-.8.456h-.064Z" />
  </svg>
)

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const CaretRightIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
  </svg>
)

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

// ============================================================================
// Main Export
// ============================================================================

export function MenuPlayground() {
  const [activeDemo, setActiveDemoState] = React.useState<string | null>(() => {
    // Initialize from URL hash on mount
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (hash) return hash
    }
    return null
  })
  const [configContent, setConfigContent] =
    React.useState<React.ReactNode>(null)

  // Sync activeDemo to URL hash for persistence across hot reloads
  const setActiveDemo = React.useCallback((id: string | null) => {
    setActiveDemoState(id)
    if (typeof window !== 'undefined' && id) {
      // Update hash without scrolling (we manage scroll ourselves)
      window.history.replaceState(null, '', `#${id}`)
    }
  }, [])

  // Restore scroll position on mount from hash
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (hash) {
        // Delay to ensure elements are mounted
        requestAnimationFrame(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'instant' })
          }
        })
      }
    }
  }, [])

  return (
    <PlaygroundContext.Provider
      value={{ activeDemo, setActiveDemo, configContent, setConfigContent }}
    >
      <div className="flex flex-1 overflow-hidden relative">
        <TOCSidebar />
        <MainPlayground />
        <FloatingConfigPanel />
      </div>
    </PlaygroundContext.Provider>
  )
}
