'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  ItemContext,
  useListboxContext,
  useSurfaceContext,
} from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { usePopupMenuDebug } from '../../contexts/popup-menu-debug-context.js'
import { useSubmenuContext } from '../../contexts/submenu-context.js'
import { useAimGuard } from '../../hooks/use-aim-guard.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import {
  type AnchorSide,
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../../utils/aim-guard.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'
import { useMouseTrail } from '../../utils/use-mouse-trail.js'
import {
  PopupMenuSubmenuSafeTriangleArea,
  type PopupMenuSubmenuSafeTriangleTone,
} from './submenu-safe-triangle-area.js'
import { PopupMenuSubmenuTriggerDataAttributes } from './submenu-trigger-indicator.js'

export interface PopupMenuSubmenuTriggerState extends Record<string, unknown> {
  /**
   * Whether this is a submenu trigger (always true).
   */
  submenuTrigger: boolean
  /**
   * Whether the submenu popup is open.
   */
  popupOpen: boolean
  /**
   * Whether the submenu owns keyboard focus.
   */
  popupFocused: boolean
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

// Custom mapping to convert state to kebab-case data attributes
const stateAttributesMapping = {
  submenuTrigger: (value: unknown) =>
    value
      ? { [PopupMenuSubmenuTriggerDataAttributes.submenuTrigger]: '' }
      : null,
  popupOpen: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupFocused]: '' } : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.disabled]: '' } : null,
  first: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.lastInGroup]: '' } : null,
}

export interface PopupMenuSubmenuTriggerProps
  extends ComponentProps<'div', PopupMenuSubmenuTrigger.State> {
  /**
   * Explicit unique identifier for this item in the store.
   * When provided (e.g., from data-first API's computed composite ID),
   * this takes priority over `value` for store registration.
   */
  id?: string

  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether the submenu opens when this trigger is highlighted.
   * @default true
   */
  openOnHighlight?: boolean

  /**
   * Delay before opening the submenu (in milliseconds).
   * Can be a number (applies to both pointer and keyboard) or an object
   * with separate `pointer` and `keyboard` values.
   * @default { pointer: 0, keyboard: 150 }
   */
  delay?: number | { pointer?: number; keyboard?: number }

  /**
   * Delay before closing the submenu when pointer leaves (in milliseconds).
   * @default 0
   */
  closeDelay?: number

  /**
   * Whether the submenu closes when the pointer leaves the trigger without aiming at the submenu popup.
   * When `false`, the submenu stays open until closed by another path (sibling highlight, keyboard, outside click, etc.).
   * @default true
   */
  closeOnPointerLeave?: boolean

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

type SubmenuSafeTriangleDebugState = 'hidden' | 'hover' | 'activated' | 'missed'

interface SubmenuSafeTriangleDebugSnapshot {
  contentRect: DOMRect
  triggerRect: DOMRect | null
  pointerX: number
  pointerY: number
}

/**
 * A menu item that opens a submenu when hovered.
 * Must be used within PopupMenu.Submenu.
 * Renders a `<div>` element with role="menuitem" wrapped in Popover.Trigger.
 */
export const PopupMenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubmenuTrigger.Props
>(function PopupMenuSubmenuTrigger(props, forwardedRef) {
  const {
    id: idProp,
    value,
    keywords,
    disabled: disabledProp = false,
    forceMount = false,
    openOnHighlight = true,
    delay: delayProp,
    closeDelay = 0,
    closeOnPointerLeave = true,
    forceOrder,
    forceScore,
    render,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    children,
    ...rest
  } = props

  // Normalize delay prop to { pointer, keyboard } format
  const delay = React.useMemo(() => {
    if (typeof delayProp === 'number') {
      return { pointer: delayProp, keyboard: delayProp }
    }
    return {
      pointer: delayProp?.pointer ?? 0,
      keyboard: delayProp?.keyboard ?? 150,
    }
  }, [delayProp])

  // Get parent menu's store (from Surface context)
  const { store: parentStore } = useSurfaceContext()

  // Get depth from listbox context (this is the submenu's depth, parent is depth - 1)
  const { depth } = useListboxContext()
  const parentDepth = depth - 1

  // Get submenu context for open state and refs
  const submenuContext = useSubmenuContext()
  const {
    open,
    setOpen,
    suppressAutoOpenRef,
    triggerRef,
    contentRef,
    childSurfaceId,
  } = submenuContext

  // Timer for delayed opening (pointer / keyboard navigation)
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timer for delayed close on pointer leave misses
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveMonitorCleanupRef = React.useRef<(() => void) | null>(null)
  const leaveMonitorTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const clearOpenTimer = React.useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = React.useCallback(() => {
    if (!closeOnPointerLeave) {
      return
    }

    clearCloseTimer()

    if (closeDelay <= 0) {
      setOpen(false)
      return
    }

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
    }, closeDelay)
  }, [clearCloseTimer, closeDelay, closeOnPointerLeave, setOpen])

  const clearLeaveMonitor = React.useCallback(() => {
    if (leaveMonitorCleanupRef.current) {
      leaveMonitorCleanupRef.current()
      leaveMonitorCleanupRef.current = null
    }

    if (leaveMonitorTimerRef.current !== null) {
      clearTimeout(leaveMonitorTimerRef.current)
      leaveMonitorTimerRef.current = null
    }
  }, [])

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      clearOpenTimer()
      clearCloseTimer()
      clearLeaveMonitor()
    }
  }, [clearOpenTimer, clearCloseTimer, clearLeaveMonitor])

  // Get focus owner store for keyboard focus transfer
  const focusOwnerStore = useFocusOwner()

  // Get aim guard for safe polygon navigation
  const {
    aimGuardActive,
    guardedTriggerId,
    guardedDepth,
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    activateAimGuard,
    clearAimGuard,
  } = useAimGuard()

  // Track mouse positions for aim guard trajectory calculation
  const mouseTrailRef = useMouseTrail(4)

  const { showSafeTriangleArea, logAimGuardEvents } = usePopupMenuDebug()
  const showSafeTriangleAreaEnabled = showSafeTriangleArea.enabled
  const [submenuSafeTriangleDebugState, setSubmenuSafeTriangleDebugState] =
    React.useState<SubmenuSafeTriangleDebugState>('hidden')
  const [
    submenuSafeTriangleDebugSnapshot,
    setSubmenuSafeTriangleDebugSnapshot,
  ] = React.useState<SubmenuSafeTriangleDebugSnapshot | null>(null)
  const missSafeTriangleTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  // Use the shared item hook for registration, visibility, and highlight state
  // When id is provided (e.g., from data-first API), it takes priority for store registration
  const item = usePopupMenuItem({
    id: idProp,
    value,
    keywords,
    disabled: disabledProp,
    forceMount,
    forceOrder,
    forceScore,
    isSubmenuTrigger: true,
    closeOnClick: false, // Submenu triggers don't close the menu
    children,
  })

  const disabled = item.disabled

  const logAimTrace = React.useCallback(
    (eventName: string, details?: Record<string, unknown>) => {
      if (!logAimGuardEvents) {
        return
      }

      console.log(`[PopupMenu][AimGuard] ${eventName}`, {
        triggerId: item.id,
        triggerStoreId: item.storeId,
        parentDepth,
        aimGuardActive: aimGuardActiveRef.current,
        guardedTriggerId: guardedTriggerIdRef.current,
        guardedDepth: guardedDepthRef.current,
        ...details,
      })
    },
    [
      logAimGuardEvents,
      item.id,
      item.storeId,
      parentDepth,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      guardedDepthRef,
    ],
  )

  const clearMissSafeTriangleTimer = React.useCallback(() => {
    if (missSafeTriangleTimerRef.current !== null) {
      clearTimeout(missSafeTriangleTimerRef.current)
      missSafeTriangleTimerRef.current = null
    }
  }, [])

  React.useEffect(
    () => clearMissSafeTriangleTimer,
    [clearMissSafeTriangleTimer],
  )

  const showActivatedSafeTriangle = React.useCallback(
    (snapshot: SubmenuSafeTriangleDebugSnapshot) => {
      if (!showSafeTriangleAreaEnabled) {
        return
      }

      clearMissSafeTriangleTimer()

      if (showSafeTriangleArea.freezeOnPointerLeave) {
        setSubmenuSafeTriangleDebugSnapshot(snapshot)
      } else {
        setSubmenuSafeTriangleDebugSnapshot(null)
      }

      setSubmenuSafeTriangleDebugState('activated')
    },
    [
      showSafeTriangleAreaEnabled,
      showSafeTriangleArea.freezeOnPointerLeave,
      clearMissSafeTriangleTimer,
    ],
  )

  const showMissedSafeTriangle = React.useCallback(
    (snapshot: SubmenuSafeTriangleDebugSnapshot) => {
      clearMissSafeTriangleTimer()

      if (!showSafeTriangleAreaEnabled || !showSafeTriangleArea.showMissState) {
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
        return
      }

      setSubmenuSafeTriangleDebugState('missed')
      setSubmenuSafeTriangleDebugSnapshot(snapshot)

      const hideAfter = showSafeTriangleArea.missFreezeDuration
      if (hideAfter <= 0) {
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
        return
      }

      missSafeTriangleTimerRef.current = setTimeout(() => {
        missSafeTriangleTimerRef.current = null
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
      }, hideAfter)
    },
    [
      clearMissSafeTriangleTimer,
      showSafeTriangleAreaEnabled,
      showSafeTriangleArea.showMissState,
      showSafeTriangleArea.missFreezeDuration,
    ],
  )

  const startLeaveMonitor = React.useCallback(
    (
      anchor: AnchorSide,
      triggerRect: DOMRect | null,
      initialHit: boolean,
      timeoutMs: number,
      initialPointerX: number,
      initialPointerY: number,
    ) => {
      clearLeaveMonitor()

      logAimTrace('leave-monitor-start', {
        anchor,
        initialHit,
        timeoutMs,
        closeDelay,
        triggerRect,
        initialPointerX,
        initialPointerY,
      })

      if (timeoutMs <= 0) {
        logAimTrace('leave-monitor-skip-timeout', { timeoutMs })
        return
      }

      let lastHit = initialHit
      let previousPointerX = initialPointerX
      let previousPointerY = initialPointerY

      const onWindowPointerMove = (pointerEvent: PointerEvent) => {
        if (!isMouseLikePointerType(pointerEvent.pointerType)) {
          return
        }

        const contentRect = contentRef.current?.getBoundingClientRect()
        if (!contentRect) {
          logAimTrace('leave-monitor-stop-no-content-rect')
          clearLeaveMonitor()
          return
        }

        const { clientX, clientY } = pointerEvent
        const isInsidePopup =
          clientX >= contentRect.left &&
          clientX <= contentRect.right &&
          clientY >= contentRect.top &&
          clientY <= contentRect.bottom

        const axisDelta =
          anchor === 'left' || anchor === 'right'
            ? clientX - previousPointerX
            : clientY - previousPointerY

        previousPointerX = clientX
        previousPointerY = clientY

        if (isInsidePopup) {
          logAimTrace('leave-monitor-inside-popup', {
            clientX,
            clientY,
          })
          clearCloseTimer()
          clearLeaveMonitor()
          return
        }

        const movedAwayFromSubmenu =
          (anchor === 'left' && axisDelta <= -2) ||
          (anchor === 'right' && axisDelta >= 2) ||
          (anchor === 'top' && axisDelta <= -2) ||
          (anchor === 'bottom' && axisDelta >= 2)

        logAimTrace('leave-monitor-pointermove', {
          anchor,
          clientX,
          clientY,
          axisDelta,
          movedAwayFromSubmenu,
          lastHit,
        })

        if (lastHit && movedAwayFromSubmenu) {
          const debugSnapshot: SubmenuSafeTriangleDebugSnapshot = {
            contentRect,
            triggerRect,
            pointerX: clientX,
            pointerY: clientY,
          }

          lastHit = false
          logAimTrace('leave-monitor-reversal-close', {
            anchor,
            clientX,
            clientY,
            axisDelta,
          })
          showMissedSafeTriangle(debugSnapshot)
          clearAimGuard()
          scheduleClose()

          if (closeDelay <= 0 || !closeOnPointerLeave) {
            clearLeaveMonitor()
          }

          return
        }

        const heading = getSmoothedHeading(
          mouseTrailRef.current,
          clientX,
          clientY,
          anchor,
          triggerRect,
          contentRect,
        )

        const hit = willHitSubmenu(
          clientX,
          clientY,
          heading,
          contentRect,
          anchor,
          triggerRect,
        )

        logAimTrace('leave-monitor-hit-eval', {
          anchor,
          clientX,
          clientY,
          hit,
          lastHit,
          heading,
        })

        if (hit === lastHit) {
          return
        }

        const debugSnapshot: SubmenuSafeTriangleDebugSnapshot = {
          contentRect,
          triggerRect,
          pointerX: clientX,
          pointerY: clientY,
        }

        lastHit = hit

        if (hit) {
          logAimTrace('leave-monitor-hit-transition', {
            anchor,
            clientX,
            clientY,
          })
          showActivatedSafeTriangle(debugSnapshot)
          clearCloseTimer()
          activateAimGuard(item.id, parentDepth, childSurfaceId, 600)
          parentStore.setHighlightedId(item.storeId)
          setOpen(true)
          return
        }

        logAimTrace('leave-monitor-miss-transition', {
          anchor,
          clientX,
          clientY,
        })
        showMissedSafeTriangle(debugSnapshot)
        clearAimGuard()
        scheduleClose()

        if (closeDelay <= 0 || !closeOnPointerLeave) {
          clearLeaveMonitor()
        }
      }

      window.addEventListener('pointermove', onWindowPointerMove, {
        passive: true,
      })

      leaveMonitorCleanupRef.current = () => {
        logAimTrace('leave-monitor-cleanup-remove-listener')
        window.removeEventListener('pointermove', onWindowPointerMove)
      }

      leaveMonitorTimerRef.current = setTimeout(() => {
        leaveMonitorTimerRef.current = null
        logAimTrace('leave-monitor-timeout-expired', { timeoutMs })
        clearLeaveMonitor()
      }, timeoutMs)
    },
    [
      clearLeaveMonitor,
      logAimTrace,
      contentRef,
      clearCloseTimer,
      mouseTrailRef,
      showActivatedSafeTriangle,
      activateAimGuard,
      item.id,
      parentDepth,
      childSurfaceId,
      parentStore,
      item.storeId,
      setOpen,
      showMissedSafeTriangle,
      clearAimGuard,
      scheduleClose,
      closeDelay,
      closeOnPointerLeave,
    ],
  )

  React.useEffect(() => {
    if (showSafeTriangleAreaEnabled) {
      return
    }

    clearMissSafeTriangleTimer()
    setSubmenuSafeTriangleDebugState('hidden')
    setSubmenuSafeTriangleDebugSnapshot(null)
  }, [showSafeTriangleAreaEnabled, clearMissSafeTriangleTimer])

  React.useEffect(() => {
    if (
      !showSafeTriangleAreaEnabled ||
      showSafeTriangleArea.persistOnSuccess ||
      submenuSafeTriangleDebugState !== 'activated'
    ) {
      return
    }

    const isGuardActiveForThisTrigger =
      aimGuardActive &&
      guardedTriggerId === item.id &&
      guardedDepth === parentDepth

    if (!isGuardActiveForThisTrigger) {
      clearMissSafeTriangleTimer()
      setSubmenuSafeTriangleDebugState('hidden')
      setSubmenuSafeTriangleDebugSnapshot(null)
    }
  }, [
    showSafeTriangleAreaEnabled,
    showSafeTriangleArea.persistOnSuccess,
    submenuSafeTriangleDebugState,
    aimGuardActive,
    guardedTriggerId,
    guardedDepth,
    item.id,
    parentDepth,
    clearMissSafeTriangleTimer,
  ])

  React.useEffect(() => {
    if (submenuSafeTriangleDebugState !== 'activated' || open) {
      return
    }

    clearMissSafeTriangleTimer()
    setSubmenuSafeTriangleDebugState('hidden')
    setSubmenuSafeTriangleDebugSnapshot(null)
  }, [submenuSafeTriangleDebugState, open, clearMissSafeTriangleTimer])

  React.useEffect(() => {
    if (!open) {
      clearCloseTimer()
      clearLeaveMonitor()
    }
  }, [open, clearCloseTimer, clearLeaveMonitor])

  React.useEffect(() => {
    if (
      open ||
      !aimGuardActiveRef.current ||
      guardedTriggerIdRef.current !== item.id ||
      guardedDepthRef.current !== parentDepth
    ) {
      return
    }

    clearAimGuard()
  }, [
    open,
    item.id,
    parentDepth,
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    clearAimGuard,
  ])

  React.useEffect(() => {
    if (
      item.isVisible ||
      !aimGuardActiveRef.current ||
      guardedTriggerIdRef.current !== item.id ||
      guardedDepthRef.current !== parentDepth
    ) {
      return
    }

    clearAimGuard()
  }, [
    item.isVisible,
    item.id,
    parentDepth,
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    clearAimGuard,
  ])

  React.useEffect(() => {
    return () => {
      if (
        aimGuardActiveRef.current &&
        guardedTriggerIdRef.current === item.id &&
        guardedDepthRef.current === parentDepth
      ) {
        clearAimGuard()
      }
    }
  }, [
    item.id,
    parentDepth,
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    clearAimGuard,
  ])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const contentEl = contentRef.current
    if (!contentEl) {
      return
    }

    const handlePointerEnterContent = () => {
      clearCloseTimer()
      clearLeaveMonitor()
    }

    const handlePointerMoveContent = () => {
      clearCloseTimer()
      clearLeaveMonitor()
    }

    contentEl.addEventListener('pointerenter', handlePointerEnterContent)
    contentEl.addEventListener('pointermove', handlePointerMoveContent, {
      passive: true,
    })

    return () => {
      contentEl.removeEventListener('pointerenter', handlePointerEnterContent)
      contentEl.removeEventListener('pointermove', handlePointerMoveContent)
    }
  }, [open, contentRef, clearCloseTimer, clearLeaveMonitor])

  // Register submenu open callback with parent store
  // When submenu is opened via keyboard (ArrowRight/Ctrl+L), transfer focus ownership
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(item.storeId, () => {
      setOpen(true)
      // Transfer focus ownership to the submenu surface
      focusOwnerStore.setOwnerId(childSurfaceId)
      // Auto-focus after DOM is ready
      requestAnimationFrame(() => {
        const input = contentRef.current?.querySelector('input')
        const list = contentRef.current?.querySelector('[role="listbox"]')
        const focusTarget = input ?? list
        if (focusTarget && focusTarget instanceof HTMLElement) {
          focusTarget.focus()
        }
      })
    })
  }, [
    item.storeId,
    parentStore,
    setOpen,
    focusOwnerStore,
    childSurfaceId,
    contentRef,
  ])

  // Register submenu close callback with parent store
  // This allows the store to close this submenu when another item is highlighted
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(item.storeId, () => setOpen(false))
  }, [item.storeId, parentStore, setOpen])

  // Check if this submenu owns keyboard focus
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  // Close submenu when trigger becomes invisible (e.g., filtered out by search)
  // This prevents the popup from rendering without its anchor element
  React.useEffect(() => {
    if (!item.isVisible && open) {
      setOpen(false)
    }
  }, [item.isVisible, open, setOpen])

  // Reset suppression when highlight leaves this trigger
  React.useEffect(() => {
    if (!item.isHighlighted) {
      suppressAutoOpenRef.current = false
    }
  }, [item.isHighlighted, suppressAutoOpenRef])

  // When highlighted via keyboard, schedule open after keyboard delay
  // This effect only handles *navigation* highlight (ArrowUp/Down).
  // Explicit open actions (ArrowRight, Ctrl+L) bypass this by calling registerSubmenuOpen directly.
  // biome-ignore lint/correctness/useExhaustiveDependencies(suppressAutoOpenRef.current): read via ref on purpose — suppression must not (re)schedule this effect, it is only consulted when the highlight changes
  React.useEffect(() => {
    // Skip if openOnHighlight is disabled
    if (!openOnHighlight) {
      return
    }

    // Only schedule open when highlighted via explicit keyboard navigation
    // Don't auto-open for 'auto' highlights (search results, initial open)
    if (
      !item.isHighlighted ||
      parentStore.state.highlightSource !== 'keyboard'
    ) {
      clearOpenTimer()
      return
    }

    // Don't auto-open if user just explicitly closed the submenu (e.g. ArrowLeft)
    if (suppressAutoOpenRef.current) {
      return
    }

    const keyboardDelay = delay.keyboard
    if (keyboardDelay <= 0) {
      setOpen(true)
    } else {
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        // An armed timer survives an explicit close (opening doesn't clear it
        // and the highlight doesn't change), so consult the latch here too.
        if (suppressAutoOpenRef.current) return
        setOpen(true)
      }, keyboardDelay)
    }

    return clearOpenTimer
  }, [
    item.isHighlighted,
    parentStore,
    delay.keyboard,
    setOpen,
    clearOpenTimer,
    openOnHighlight,
  ])

  // Set the trigger ref when element mounts
  React.useEffect(() => {
    ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
      item.ref.current
    return () => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = null
    }
  }, [triggerRef, item.ref])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Prevent focus from leaving the input
      event.preventDefault()

      if (open) {
        suppressAutoOpenRef.current = true
        logAimTrace('pointerdown-suppress-auto-open', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
      }

      onPointerDown?.(event)
    },
    [open, logAimTrace, onPointerDown, suppressAutoOpenRef],
  )

  // Custom pointer move handler for submenu triggers
  // Different from usePopupMenuItem's handler: allows the guarded trigger to highlight itself
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return

      // Check if pointer has actually moved (prevents phantom highlights)
      if (
        !parentStore.shouldAllowPointerHighlight(event.clientX, event.clientY)
      ) {
        return
      }

      // Don't highlight if aim guard is active at this depth for a different trigger
      if (
        aimGuardActiveRef.current &&
        guardedDepthRef.current === parentDepth &&
        guardedTriggerIdRef.current !== item.id
      ) {
        logAimTrace('pointermove-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guardedTriggerIdRef.current,
        })
        return
      }

      // Highlight on hover (use storeId for store operations)
      parentStore.setHighlightedId(item.storeId)

      // Pointer move can be the first allowed event after aim-guard unblocks
      // this row (e.g. pointerenter was blocked earlier), so allow it to open.
      if (!openOnHighlight || open) {
        return
      }

      if (suppressAutoOpenRef.current) {
        logAimTrace('pointermove-open-suppressed-after-explicit-close', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }

      clearLeaveMonitor()
      clearCloseTimer()

      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) {
        setOpen(true)
        return
      }

      if (openTimerRef.current !== null) {
        return
      }

      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        setOpen(true)
      }, pointerDelay)
    },
    [
      onPointerMove,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      parentDepth,
      guardedTriggerIdRef,
      item.id,
      item.storeId,
      openOnHighlight,
      open,
      suppressAutoOpenRef,
      clearLeaveMonitor,
      clearCloseTimer,
      delay.pointer,
      setOpen,
      logAimTrace,
      parentStore,
    ],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)

      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return

      // Check if aim guard is blocking this trigger
      if (
        aimGuardActiveRef.current &&
        guardedDepthRef.current === parentDepth &&
        guardedTriggerIdRef.current !== item.id
      ) {
        logAimTrace('pointerenter-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guardedTriggerIdRef.current,
          blockedByDepth: guardedDepthRef.current,
        })
        return
      }

      logAimTrace('pointerenter-submenu-trigger', {
        clientX: event.clientX,
        clientY: event.clientY,
      })

      if (showSafeTriangleAreaEnabled) {
        clearMissSafeTriangleTimer()
        setSubmenuSafeTriangleDebugSnapshot(null)
        setSubmenuSafeTriangleDebugState('hover')
      }

      // Highlight the trigger on pointer enter (use storeId for store operations)
      parentStore.setHighlightedId(item.storeId)

      // Skip submenu opening if openOnHighlight is disabled
      if (!openOnHighlight) return

      if (suppressAutoOpenRef.current) {
        logAimTrace('pointerenter-open-suppressed-after-explicit-close', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }

      // Clear any existing aim guard and schedule open with delay
      clearLeaveMonitor()
      clearAimGuard()
      clearOpenTimer()
      clearCloseTimer()

      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) {
        setOpen(true)
      } else {
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null
          setOpen(true)
        }, pointerDelay)
      }
    },
    [
      onPointerEnter,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      guardedTriggerIdRef,
      item.id,
      item.storeId,
      parentStore,
      openOnHighlight,
      suppressAutoOpenRef,
      clearLeaveMonitor,
      clearAimGuard,
      clearOpenTimer,
      clearCloseTimer,
      clearMissSafeTriangleTimer,
      showSafeTriangleAreaEnabled,
      delay.pointer,
      setOpen,
      logAimTrace,
      parentDepth,
    ],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)

      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return

      // Cancel any pending open timer
      clearOpenTimer()

      logAimTrace('pointerleave-submenu-trigger', {
        clientX: event.clientX,
        clientY: event.clientY,
      })

      // Check if aim guard is blocking this trigger
      if (
        aimGuardActiveRef.current &&
        guardedDepthRef.current === parentDepth &&
        guardedTriggerIdRef.current !== item.id
      ) {
        logAimTrace('pointerleave-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guardedTriggerIdRef.current,
          blockedByDepth: guardedDepthRef.current,
        })
        return
      }

      // Get the submenu content rect for safe polygon calculation
      const contentRect = contentRef.current?.getBoundingClientRect()
      if (!contentRect) {
        logAimTrace('pointerleave-no-content-rect')
        clearLeaveMonitor()
        clearMissSafeTriangleTimer()
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
        clearAimGuard()
        scheduleClose()
        return
      }

      // Check if pointer is already inside the popup (can happen with fast movement or overlapping elements)
      const { clientX, clientY } = event

      // Get trigger rect for aim guard calculation
      const tRect = triggerRef.current?.getBoundingClientRect() ?? null
      const debugSnapshot: SubmenuSafeTriangleDebugSnapshot = {
        contentRect,
        triggerRect: tRect,
        pointerX: clientX,
        pointerY: clientY,
      }

      const isInsidePopup =
        clientX >= contentRect.left &&
        clientX <= contentRect.right &&
        clientY >= contentRect.top &&
        clientY <= contentRect.bottom

      if (isInsidePopup) {
        // Pointer is already in the popup, clear guard and keep open
        logAimTrace('pointerleave-inside-popup-success', {
          clientX,
          clientY,
        })
        showActivatedSafeTriangle(debugSnapshot)
        clearCloseTimer()
        clearLeaveMonitor()
        clearAimGuard()
        return
      }

      // Calculate safe polygon and check if user is aiming toward submenu
      const anchor = resolveAnchorSide(contentRect, tRect, clientX, clientY)
      const heading = getSmoothedHeading(
        mouseTrailRef.current,
        clientX,
        clientY,
        anchor,
        tRect,
        contentRect,
      )
      const hit = willHitSubmenu(
        clientX,
        clientY,
        heading,
        contentRect,
        anchor,
        tRect,
      )

      logAimTrace('pointerleave-hit-eval', {
        anchor,
        hit,
        clientX,
        clientY,
        heading,
      })

      if (hit) {
        // User is aiming at submenu - activate aim guard for 600ms
        // Guard is activated at parentDepth to block highlighting in the parent menu only
        logAimTrace('pointerleave-hit-activate-guard', {
          anchor,
          clientX,
          clientY,
        })
        showActivatedSafeTriangle(debugSnapshot)
        activateAimGuard(item.id, parentDepth, childSurfaceId, 600)
        parentStore.setHighlightedId(item.storeId)
        setOpen(true)
        startLeaveMonitor(anchor, tRect, true, 600, clientX, clientY)
      } else {
        // User is not aiming at submenu - close it
        logAimTrace('pointerleave-miss-close', {
          anchor,
          clientX,
          clientY,
        })
        showMissedSafeTriangle(debugSnapshot)
        clearAimGuard()
        scheduleClose()
        if (!closeOnPointerLeave) {
          clearLeaveMonitor()
        } else if (closeDelay > 0) {
          startLeaveMonitor(anchor, tRect, false, closeDelay, clientX, clientY)
        } else {
          clearLeaveMonitor()
        }
      }
    },
    [
      onPointerLeave,
      disabled,
      clearOpenTimer,
      aimGuardActiveRef,
      guardedDepthRef,
      guardedTriggerIdRef,
      item.id,
      item.storeId,
      closeDelay,
      closeOnPointerLeave,
      contentRef,
      clearLeaveMonitor,
      clearMissSafeTriangleTimer,
      clearAimGuard,
      showActivatedSafeTriangle,
      showMissedSafeTriangle,
      setOpen,
      clearCloseTimer,
      scheduleClose,
      startLeaveMonitor,
      triggerRef,
      mouseTrailRef,
      activateAimGuard,
      parentDepth,
      childSurfaceId,
      parentStore,
      logAimTrace,
    ],
  )

  const state: PopupMenuSubmenuTrigger.State = React.useMemo(
    () => ({
      submenuTrigger: true,
      popupOpen: open,
      popupFocused: isPopupFocused,
      highlighted: item.isHighlighted,
      disabled,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [open, isPopupFocused, item.isHighlighted, disabled, item.positional],
  )

  // Wrap children with ItemContext.Provider so child components can access item state
  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'submenu-trigger')

  // Use useRender to create the element with state-based data attributes
  const element = useRender({
    render,
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      children: wrappedChildren,
    },
    defaultTagName: 'div',
  })

  const safeTriangleTone: PopupMenuSubmenuSafeTriangleTone | null =
    React.useMemo(() => {
      if (submenuSafeTriangleDebugState === 'hover') {
        return 'hover'
      }

      if (submenuSafeTriangleDebugState === 'activated') {
        return 'activated'
      }

      if (submenuSafeTriangleDebugState === 'missed') {
        return 'missed'
      }

      return null
    }, [submenuSafeTriangleDebugState])

  const trigger = <Popover.Trigger nativeButton={false} render={element} />

  // Don't render if not visible
  if (!item.isVisible) return null

  if (!showSafeTriangleAreaEnabled || safeTriangleTone === null) {
    return trigger
  }

  return (
    <>
      {trigger}
      <PopupMenuSubmenuSafeTriangleArea
        config={showSafeTriangleArea}
        contentRef={contentRef}
        triggerRef={triggerRef}
        tone={safeTriangleTone}
        contentRectOverride={submenuSafeTriangleDebugSnapshot?.contentRect}
        triggerRectOverride={submenuSafeTriangleDebugSnapshot?.triggerRect}
        mousePointOverride={
          submenuSafeTriangleDebugSnapshot
            ? [
                submenuSafeTriangleDebugSnapshot.pointerX,
                submenuSafeTriangleDebugSnapshot.pointerY,
              ]
            : null
        }
      />
    </>
  )
})

export namespace PopupMenuSubmenuTrigger {
  export type State = PopupMenuSubmenuTriggerState
  export interface Props extends PopupMenuSubmenuTriggerProps {}
}
