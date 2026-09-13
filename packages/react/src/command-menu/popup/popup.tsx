'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import { PopupSurfaceIdContext } from '../../internal/popup-menu/contexts/popup-surface-id-context.js'
import { SubpageStackContext } from '../../internal/popup-menu/contexts/subpage-stack-context.js'
import {
  DataPopupContext,
  type DataSurfaceContextValue,
} from '../../internal/popup-menu/data-first/context.js'
import { DataSubpagesContent } from '../../internal/popup-menu/data-first/data-subpages.js'
import type { NodeDef } from '../../internal/popup-menu/data-first/types.js'
import { useSubpageStackState } from '../../internal/popup-menu/hooks/use-subpage-stack-state.js'
import { usePopupMenuContext } from '../../internal/popup-menu/index.js'
import type { ComponentRenderFn } from '../../utils/types.js'

export interface CommandMenuPopupState extends Dialog.Popup.State {
  /**
   * Whether any non-root subpage is currently open.
   */
  hasOpenSubpage: boolean

  /**
   * Active subpage ID, or null when only the root page is open.
   */
  subpageId: string | null
}

export interface CommandMenuPopupProps
  extends Omit<Dialog.Popup.Props, 'className' | 'render'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: CommandMenuPopupState) => string)

  /**
   * Allows replacing the popup element with a custom element.
   * The render state includes dialog popup + subpage navigation state.
   */
  render?:
    | React.ReactElement
    | ComponentRenderFn<
        React.HTMLAttributes<HTMLElement>,
        CommandMenuPopupState
      >
}

/**
 * A container for the command menu contents.
 * Wraps Dialog.Popup with popup-menu subpage and data providers.
 */
export const CommandMenuPopup = React.forwardRef<
  HTMLDivElement,
  CommandMenuPopup.Props
>(function CommandMenuPopup(props, forwardedRef) {
  const {
    children,
    className: classNameProp,
    render: renderProp,
    ...rest
  } = props

  const surfaceId = React.useId()
  const popupMenuContext = usePopupMenuContext()

  const {
    subpageStackContextValue,
    isSubpageNavigating,
    hasOpenSubpage,
    subpageId,
  } = useSubpageStackState({
    surfaceId,
    store: popupMenuContext.store,
  })

  const [dataSurfaceContext, setDataSurfaceContext] =
    React.useState<DataSurfaceContextValue | null>(null)
  const [resolvedContent, setResolvedContent] = React.useState<
    NodeDef[] | null
  >(null)

  const toPopupState = React.useCallback(
    (baseState: Dialog.Popup.State): CommandMenuPopupState => ({
      ...baseState,
      hasOpenSubpage,
      subpageId,
    }),
    [hasOpenSubpage, subpageId],
  )

  const className = React.useMemo(() => {
    if (typeof classNameProp === 'function') {
      return (baseState: Dialog.Popup.State) => {
        return classNameProp(toPopupState(baseState))
      }
    }
    return classNameProp
  }, [classNameProp, toPopupState])

  const render = React.useMemo(() => {
    if (typeof renderProp === 'function') {
      return (
        popupProps: React.HTMLAttributes<HTMLElement>,
        baseState: Dialog.Popup.State,
      ) => renderProp(popupProps, toPopupState(baseState))
    }

    return renderProp
  }, [renderProp, toPopupState])

  const dataPopupContextValue = React.useMemo(
    () => ({
      dataSurfaceContext,
      setDataSurfaceContext,
      resolvedContent,
      setResolvedContent,
    }),
    [dataSurfaceContext, resolvedContent],
  )

  return (
    <PopupSurfaceIdContext.Provider value={surfaceId}>
      <SubpageStackContext.Provider value={subpageStackContextValue}>
        <DataPopupContext.Provider value={dataPopupContextValue}>
          <Dialog.Popup
            ref={forwardedRef}
            className={className}
            render={render}
            data-command-menu-popup=""
            data-navigating={isSubpageNavigating ? '' : undefined}
            data-has-open-subpage={hasOpenSubpage ? '' : undefined}
            {...rest}
          >
            {children}
            <DataSubpagesContent />
          </Dialog.Popup>
        </DataPopupContext.Provider>
      </SubpageStackContext.Provider>
    </PopupSurfaceIdContext.Provider>
  )
})

export namespace CommandMenuPopup {
  export type Props = CommandMenuPopupProps
  export type State = CommandMenuPopupState
}
