'use client'

import * as React from 'react'

export interface SubpageRegistration {
  pageId: string
  surfaceId: string
  closeRootOnEsc: boolean
}

export interface SubpageStackContextValue {
  /** Active page ID; `null` when the root surface is active. */
  activePageId: string | null
  /** Surface ID of the root surface. */
  rootSurfaceId: string
  /** Surface ID for the currently active page. */
  activeSurfaceId: string
  /** Whether there is a previous page to navigate back to. */
  canGoBack: boolean
  /** Whether Escape in the active page should close the entire menu tree. */
  shouldCloseRootOnEsc: boolean
  /** Open page IDs, bottom to top; empty at root. */
  stack: readonly string[]
  /** Register a page and return an unregister cleanup. */
  registerPage: (registration: SubpageRegistration) => () => void
  /** Push a page onto the stack. Returns true when navigation happened. */
  openPage: (pageId: string) => boolean
  /** Pop one page from the stack. Returns true when navigation happened. */
  goBack: () => boolean
  /** Resolve a surface ID for a page ID. */
  getSurfaceId: (pageId: string) => string | null
}

const SubpageStackContext =
  React.createContext<SubpageStackContextValue | null>(null)

export function useSubpageStack(): SubpageStackContextValue {
  const context = React.useContext(SubpageStackContext)
  if (!context) {
    throw new Error('Subpage components must be used within a PopupMenu.Popup')
  }
  return context
}

export function useMaybeSubpageStack(): SubpageStackContextValue | null {
  return React.useContext(SubpageStackContext)
}

export { SubpageStackContext }
