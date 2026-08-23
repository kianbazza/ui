'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import type { PopupMenuOpenChangeReason } from '../../internal/popup-menu/events.js'
import {
  type GetResolvedIdFn,
  type PopupMenuIdScope,
  PopupMenuProviders,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import { useHotkey } from '../../kbd/hooks/use-hotkey.js'
import { REASONS } from '../../utils/events/index.js'

export interface CommandMenuRootProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onOpenChangeComplete?: (open: boolean) => void
  hotkey?: string
  modal?: boolean
  disabled?: boolean
  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default encoded surface Definition Path joined with `/`; `idScope="menu"` uses the Definition Key
   * Read once when the menu root mounts — later changes have no effect. To retain the old dot-path default, use `node => node.def.id ?? node.definitionPath.join('.')`. This does not recreate former tree-item ancestry; exact compatibility requires walking `node.parent` and reproducing the old slug/key lineage.
   * @example
   * <CommandMenu.Root getResolvedId={(node) => node.def.id ?? node.definitionPath.join('.')} />
   */
  getResolvedId?: GetResolvedIdFn
  /** Definition Key uniqueness scope. Read once when the menu root mounts. @default 'surface' */
  idScope?: PopupMenuIdScope
}

/**
 * Groups all parts of the command menu.
 * Manages open state and provides popup-menu context to children.
 * Doesn't render its own HTML element.
 */
export function CommandMenuRoot(props: CommandMenuRoot.Props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    hotkey,
    modal = true,
    disabled,
    getResolvedId,
    idScope = 'surface',
  } = props

  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    handleOpenChange,
    disabled: menuDisabled,
    menuTreeResolver,
  } = usePopupMenuRoot({
    onOpenChange:
      onOpenChange as unknown as UsePopupMenuRootParams['onOpenChange'],
    defaultOpen,
    disabled,
    closeOnOutsidePress: 'pointerdown',
    getResolvedId,
    idScope,
  })

  store.useControlledProp('openProp', openProp)

  const openState = store.useState('open')

  useHotkey(
    hotkey ?? '',
    () => handleOpenChange(!store.state.open, REASONS.imperativeAction),
    // allowInInput keeps the hotkey working as a *toggle*: while the menu is
    // open, focus sits in the search input, so the close press must be allowed
    // to fire from an editable target.
    { enabled: !!hotkey && !menuDisabled, allowInInput: true },
  )

  const handleDialogOpenChange = React.useCallback(
    (nextOpen: boolean, dialogDetails: Dialog.Root.ChangeEventDetails) => {
      handleOpenChange(
        nextOpen,
        dialogDetails.reason as PopupMenuOpenChangeReason,
        dialogDetails.event,
      )
    },
    [handleOpenChange],
  )

  const handleDialogOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }

      if (!nextOpen) {
        store.clearHighlight()
        store.context.onCloseComplete?.()
        store.context.onPopupCloseComplete?.()
      }

      onOpenChangeComplete?.(nextOpen)
    },
    [store, onOpenChangeComplete],
  )

  return (
    <PopupMenuProviders
      menuTreeResolver={menuTreeResolver}
      store={store}
      focusOwnerStore={focusOwnerStore}
      openChainStore={openChainStore}
      disabled={menuDisabled}
      depth={0}
      closeAll={closeAll}
      explicitTabBehavior
      tabWithoutZones="inert"
      registerSurface={registerSurface}
      menuType="dropdown"
      closeOnOutsidePress="pointerdown"
      componentName="command-menu"
    >
      <Dialog.Root
        open={openState}
        onOpenChange={handleDialogOpenChange}
        onOpenChangeComplete={handleDialogOpenChangeComplete}
        modal={modal}
      >
        {children}
      </Dialog.Root>
    </PopupMenuProviders>
  )
}

export namespace CommandMenuRoot {
  export interface Props extends CommandMenuRootProps {}
}
