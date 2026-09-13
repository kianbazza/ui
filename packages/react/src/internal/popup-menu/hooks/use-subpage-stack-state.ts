'use client'

import * as React from 'react'
import type { ListboxStore } from '../../listbox/index.js'
import type { SubpageStackContextValue } from '../contexts/subpage-stack-context.js'

const SUBPAGE_NAVIGATING_MS = 140

export interface UseSubpageStackStateParams {
  /** Surface ID of the root surface (the popup's own surface). */
  surfaceId: string
  /** Listbox store; used to chain onPopupCloseComplete reset. Null-safe. */
  store: ListboxStore | null
}

export interface UseSubpageStackStateReturn {
  /** Context value provided to SubpageStackContext consumers. */
  subpageStackContextValue: SubpageStackContextValue
  /** Whether subpage navigation is in its transient animation window. */
  isSubpageNavigating: boolean
  /** Whether any subpage is currently open. */
  hasOpenSubpage: boolean
  /** Active subpage ID, or null when the root surface is active. */
  subpageId: string | null
  /** Ordered stack of open subpage IDs. */
  openSubpageIds: string[]
}

/**
 * Centralized subpage stack state for popup menu surfaces.
 */
export function useSubpageStackState(
  params: UseSubpageStackStateParams,
): UseSubpageStackStateReturn {
  const { surfaceId, store } = params

  // Subpage stack state (per popup instance)
  const [subpageStack, setSubpageStack] = React.useState<string[]>([])
  const subpageStackRef = React.useRef(subpageStack)
  React.useEffect(() => {
    subpageStackRef.current = subpageStack
  }, [subpageStack])

  const subpagesRef = React.useRef<
    Map<string, { surfaceId: string; closeRootOnEsc: boolean }>
  >(new Map())
  const warnedDuplicatePageIdsRef = React.useRef(new Set<string>())
  const pageRegistrantsRef = React.useRef(
    new Map<string, Array<{ surfaceId: string; closeRootOnEsc: boolean }>>(),
  )
  const [, setSubpageRegistryVersion] = React.useState(0)
  const [isSubpageNavigating, setIsSubpageNavigating] = React.useState(false)
  const subpageNavigatingTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const clearSubpageNavigatingTimer = React.useCallback(() => {
    if (subpageNavigatingTimerRef.current !== null) {
      clearTimeout(subpageNavigatingTimerRef.current)
      subpageNavigatingTimerRef.current = null
    }
  }, [])

  const beginSubpageNavigation = React.useCallback(() => {
    setIsSubpageNavigating(true)
    clearSubpageNavigatingTimer()
    subpageNavigatingTimerRef.current = setTimeout(() => {
      subpageNavigatingTimerRef.current = null
      setIsSubpageNavigating(false)
    }, SUBPAGE_NAVIGATING_MS)
  }, [clearSubpageNavigatingTimer])

  React.useEffect(
    () => clearSubpageNavigatingTimer,
    [clearSubpageNavigatingTimer],
  )

  const registerPage = React.useCallback(
    (registration: {
      pageId: string
      surfaceId: string
      closeRootOnEsc: boolean
    }) => {
      const entry = {
        surfaceId: registration.surfaceId,
        closeRootOnEsc: registration.closeRootOnEsc,
      }
      const queue = pageRegistrantsRef.current.get(registration.pageId)
      if (queue) {
        // Duplicate page ID: the first registration wins; later registrants
        // queue so one of them is promoted if the owner unmounts.
        if (
          process.env.NODE_ENV !== 'production' &&
          !warnedDuplicatePageIdsRef.current.has(registration.pageId)
        ) {
          warnedDuplicatePageIdsRef.current.add(registration.pageId)
          console.warn(
            `PopupMenu: page ID "${registration.pageId}" is registered more than once in this popup. The first registration wins. Give each Subpage a unique pageId; data-first subpages use the node's Resolved ID.`,
          )
        }
        queue.push(entry)
      } else {
        pageRegistrantsRef.current.set(registration.pageId, [entry])
        subpagesRef.current.set(registration.pageId, entry)
        setSubpageRegistryVersion((v) => v + 1)
      }

      return () => {
        const registrants = pageRegistrantsRef.current.get(registration.pageId)
        if (!registrants) return
        const index = registrants.indexOf(entry)
        if (index === -1) return
        const wasOwner = index === 0
        registrants.splice(index, 1)
        if (!wasOwner) return

        const promoted = registrants[0]
        if (promoted) {
          subpagesRef.current.set(registration.pageId, promoted)
          setSubpageRegistryVersion((v) => v + 1)
          return
        }

        pageRegistrantsRef.current.delete(registration.pageId)
        subpagesRef.current.delete(registration.pageId)
        setSubpageRegistryVersion((v) => v + 1)

        setSubpageStack((prev) => {
          if (!prev.includes(registration.pageId)) {
            return prev
          }
          const next = prev.filter((id) => id !== registration.pageId)
          return next
        })
      }
    },
    [],
  )

  const openPage = React.useCallback(
    (pageId: string) => {
      if (!subpagesRef.current.has(pageId)) {
        return false
      }

      const currentStack = subpageStackRef.current
      const currentPageId = currentStack[currentStack.length - 1]
      if (currentPageId === pageId) {
        return false
      }

      setSubpageStack((prev) => [...prev, pageId])
      beginSubpageNavigation()
      return true
    },
    [beginSubpageNavigation],
  )

  const goBack = React.useCallback(() => {
    const currentStack = subpageStackRef.current
    if (currentStack.length === 0) {
      return false
    }

    setSubpageStack((prev) => prev.slice(0, -1))
    beginSubpageNavigation()
    return true
  }, [beginSubpageNavigation])

  const getSurfaceId = React.useCallback(
    (pageId: string) => subpagesRef.current.get(pageId)?.surfaceId ?? null,
    [],
  )

  const resetSubpageNavigationState = React.useCallback(() => {
    setSubpageStack([])
    setIsSubpageNavigating(false)
    clearSubpageNavigatingTimer()
  }, [clearSubpageNavigatingTimer])

  React.useEffect(() => {
    if (!store) {
      return
    }

    const previous = store.context.onPopupCloseComplete
    const handlePopupCloseComplete = () => {
      previous?.()
      resetSubpageNavigationState()
    }

    store.context.onPopupCloseComplete = handlePopupCloseComplete

    return () => {
      if (store.context.onPopupCloseComplete === handlePopupCloseComplete) {
        store.context.onPopupCloseComplete = previous
      }
      clearSubpageNavigatingTimer()
    }
  }, [store, resetSubpageNavigationState, clearSubpageNavigatingTimer])

  const activePageId = subpageStack[subpageStack.length - 1] ?? null
  const activePageRegistration =
    activePageId === null ? undefined : subpagesRef.current.get(activePageId)
  const activeSurfaceId =
    activePageId === null
      ? surfaceId
      : (activePageRegistration?.surfaceId ?? surfaceId)
  const shouldCloseRootOnEsc =
    activePageId === null
      ? true
      : (activePageRegistration?.closeRootOnEsc ?? true)
  const canGoBack = subpageStack.length > 0
  const openSubpageIds = subpageStack
  const subpageId = openSubpageIds[openSubpageIds.length - 1] ?? null
  const hasOpenSubpage = subpageId !== null

  const subpageStackContextValue = React.useMemo(
    () => ({
      activePageId,
      rootSurfaceId: surfaceId,
      activeSurfaceId,
      canGoBack,
      shouldCloseRootOnEsc,
      stack: subpageStack,
      registerPage,
      openPage,
      goBack,
      getSurfaceId,
    }),
    [
      activePageId,
      surfaceId,
      activeSurfaceId,
      canGoBack,
      shouldCloseRootOnEsc,
      subpageStack,
      registerPage,
      openPage,
      goBack,
      getSurfaceId,
    ],
  )

  return {
    subpageStackContextValue,
    isSubpageNavigating,
    hasOpenSubpage,
    subpageId,
    openSubpageIds,
  }
}
