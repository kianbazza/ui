import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * A searchable menu with keywords on items.
 */
function _NestedSearchableMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface-root">
              <DropdownMenu.Input
                data-testid="input-root"
                placeholder="Search root..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="root-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="root-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-1">
                    Fruits Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="surface-submenu-1">
                          <DropdownMenu.Input
                            data-testid="input-submenu-1"
                            placeholder="Search submenu 1..."
                          />
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="sub1-cherry"
                              value="cherry"
                            >
                              Cherry
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-testid="sub1-date"
                              value="date"
                            >
                              Date
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                More Fruits
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup>
                                    <DropdownMenu.Surface data-testid="surface-submenu-2">
                                      <DropdownMenu.Input
                                        data-testid="input-submenu-2"
                                        placeholder="Search submenu 2..."
                                      />
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item
                                          data-testid="sub2-elderberry"
                                          value="elderberry"
                                        >
                                          Elderberry
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                          data-testid="sub2-fig"
                                          value="fig"
                                        >
                                          Fig
                                        </DropdownMenu.Item>
                                      </DropdownMenu.List>
                                      <DropdownMenu.Empty data-testid="empty-submenu-2">
                                        No results in submenu 2
                                      </DropdownMenu.Empty>
                                    </DropdownMenu.Surface>
                                  </DropdownMenu.Popup>
                                </DropdownMenu.Positioner>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Submenu>
                          </DropdownMenu.List>
                          <DropdownMenu.Empty data-testid="empty-submenu-1">
                            No results in submenu 1
                          </DropdownMenu.Empty>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-root">
                No results in root
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * A searchable menu with keywords on items.
 */
function MenuWithKeywords() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item
                  data-testid="item-apple"
                  value="apple"
                  keywords={['fruit', 'red', 'healthy']}
                >
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-banana"
                  value="banana"
                  keywords={['fruit', 'yellow', 'potassium']}
                >
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-carrot"
                  value="carrot"
                  keywords={['vegetable', 'orange', 'healthy']}
                >
                  Carrot
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * A root menu without input and a submenu with a searchable input.
 */
function MenuWithSubmenuInput() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="root-surface">
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item data-testid="root-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="root-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Fruits
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.Input
                            data-testid="submenu-input"
                            placeholder="Search submenu..."
                          />
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="submenu-apple"
                              value="apple"
                            >
                              Apple
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-testid="submenu-apricot"
                              value="apricot"
                            >
                              Apricot
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-testid="submenu-banana"
                              value="banana"
                            >
                              Banana
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with filter disabled.
 */
function MenuWithFilterDisabled() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface" filter={false}>
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with controlled search.
 */
function MenuWithControlledSearch({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              search={search}
              onSearchChange={onSearchChange}
            >
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with clearSearchOnClose behavior.
 */
function MenuWithClearSearchOnClose({
  clearSearchOnClose = true,
  onOpenChangeComplete,
}: {
  clearSearchOnClose?: boolean | 'after-exit'
  onOpenChangeComplete?: (open: boolean) => void
}) {
  return (
    <DropdownMenu.Root onOpenChangeComplete={onOpenChangeComplete}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              clearSearchOnClose={clearSearchOnClose}
            >
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with a mockable exit animation for highlight lifecycle behavior.
 */
function MenuWithHighlightLifecycle({
  onOpenChangeComplete,
}: {
  onOpenChangeComplete?: (open: boolean) => void
}) {
  return (
    <DropdownMenu.Root onOpenChangeComplete={onOpenChangeComplete}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup
            data-testid="popup"
            className="popup-menu-highlight-lifecycle-test"
          >
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with hideUntilActive input.
 */
function MenuWithHideUntilActive() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                hideUntilActive
                placeholder="Search..."
              />
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function ExplicitTabMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup-root">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="first" value="first">
                  First
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-sub">
                        <DropdownMenu.Surface>
                          <DropdownMenu.Input data-testid="input-sub" />
                          <DropdownMenu.List>
                            <DropdownMenu.Item value="nested">
                              Nested
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusZoneInputMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
                <DropdownMenu.Item value="second">Second</DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.FocusZone>
                <button data-testid="apply" type="button">
                  Apply
                </button>
                <button data-testid="cancel" type="button">
                  Cancel
                </button>
              </DropdownMenu.FocusZone>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusZoneListMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.FocusZone>
                <button data-testid="apply" type="button">
                  Apply
                </button>
                <button data-testid="cancel" type="button">
                  Cancel
                </button>
              </DropdownMenu.FocusZone>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusZoneFormMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.FocusZone>
                <input data-testid="first-input" />
                <input data-testid="second-input" />
                <button data-testid="submit" type="button">
                  Submit
                </button>
              </DropdownMenu.FocusZone>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusZoneEmptyMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.FocusZone>
                <span>hint</span>
              </DropdownMenu.FocusZone>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function HeaderFooterMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.Header data-testid="header">
                <button data-testid="header-btn" type="button">
                  Header action
                </button>
              </DropdownMenu.Header>
              <DropdownMenu.List>
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
                <DropdownMenu.Item value="second">Second</DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Footer data-testid="footer">
                <button data-testid="apply" type="button">
                  Apply
                </button>
                <button data-testid="cancel" type="button">
                  Cancel
                </button>
              </DropdownMenu.Footer>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function PreFocusedHeaderMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Header>
                <button
                  data-testid="prefocused-header-btn"
                  type="button"
                  // biome-ignore lint/a11y/noAutofocus: simulates a dialog-style focus manager focusing the first tabbable at open
                  autoFocus
                >
                  Header action
                </button>
              </DropdownMenu.Header>
              <DropdownMenu.Input data-testid="prefocused-input" />
              <DropdownMenu.List>
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusZoneSubmenuBubblingMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup-root">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input-root" />
              <DropdownMenu.List>
                <DropdownMenu.Item value="first">First</DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-sub">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item value="nested-first">
                              Nested first
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                Submenu 2
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup data-testid="popup-sub2">
                                    <DropdownMenu.Surface>
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item value="deep">
                                          Deep
                                        </DropdownMenu.Item>
                                      </DropdownMenu.List>
                                    </DropdownMenu.Surface>
                                  </DropdownMenu.Popup>
                                </DropdownMenu.Positioner>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Submenu>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
              <DropdownMenu.FocusZone>
                <button data-testid="apply" type="button">
                  Apply
                </button>
                <button data-testid="cancel" type="button">
                  Cancel
                </button>
              </DropdownMenu.FocusZone>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FocusOwnershipSyncMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup-root">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Item value="item">Item</DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-sub">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item value="nested">
                              Nested
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
              <button type="button" data-testid="raw-button">
                Raw button
              </button>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * A nested menu for testing data attributes on Popup components.
 */
function NestedMenuForDataAttrs({
  debug,
  submenuCloseDelay,
  submenuCloseOnPointerLeave,
}: {
  debug?: {
    showSafeTriangleArea?:
      | boolean
      | {
          enabled?: boolean
          idleColor?: string
          successColor?: string
          triangleFillOpacity?: number
          overlayOpacity?: number
          showStroke?: boolean
          strokeWidth?: number
          strokeDasharray?: string
          showDots?: boolean
          dotRadius?: number
          freezeOnPointerLeave?: boolean
          persistOnSuccess?: boolean
          showMissState?: boolean
          missColor?: string
          missFreezeDuration?: number
        }
    logAimGuardEvents?: boolean
  }
  submenuCloseDelay?: number
  submenuCloseOnPointerLeave?: boolean
} = {}) {
  return (
    <DropdownMenu.Root debug={debug}>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup-root">
            <DropdownMenu.Surface data-testid="surface-root">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="root-item-1" value="item1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger
                    data-testid="submenu-trigger-1"
                    closeDelay={submenuCloseDelay}
                    closeOnPointerLeave={submenuCloseOnPointerLeave}
                  >
                    Submenu 1
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-submenu-1">
                        <DropdownMenu.Surface data-testid="surface-submenu-1">
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="submenu1-item-1"
                              value="sub1-item1"
                            >
                              Submenu 1 Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                Submenu 2
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup data-testid="popup-submenu-2">
                                    <DropdownMenu.Surface data-testid="surface-submenu-2">
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item
                                          data-testid="submenu2-item-1"
                                          value="sub2-item1"
                                        >
                                          Submenu 2 Item 1
                                        </DropdownMenu.Item>
                                      </DropdownMenu.List>
                                    </DropdownMenu.Surface>
                                  </DropdownMenu.Popup>
                                </DropdownMenu.Positioner>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Submenu>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-sibling">
                    Submenu sibling
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-submenu-sibling">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="submenu-sibling-item-1"
                              value="submenu-sibling-item-1"
                            >
                              Sibling submenu item
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createRect({
  top,
  left,
  width,
  height,
}: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// Tests
// ============================================================================

describe('PopupMenu', () => {
  describe('explicit Tab behavior', () => {
    it('Tab closes the menu', async () => {
      const user = userEvent.setup()
      render(<ExplicitTabMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

      await user.tab()

      await waitFor(() => {
        expect(screen.queryByTestId('popup-root')).not.toBeInTheDocument()
      })
    })

    it('Shift+Tab closes the menu', async () => {
      const user = userEvent.setup()
      render(<ExplicitTabMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

      await user.tab({ shift: true }).catch(() => undefined)

      await waitFor(() => {
        expect(screen.queryByTestId('popup-root')).not.toBeInTheDocument()
      })
    })

    it('Tab inside a submenu closes the entire tree', async () => {
      const user = userEvent.setup()
      render(<ExplicitTabMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Submenu' })
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await waitFor(() => {
        expect(submenuTrigger).toHaveAttribute('data-highlighted')
      })

      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByTestId('popup-sub')).toBeInTheDocument()
        expect(screen.getByTestId('input-sub')).toHaveFocus()
      })

      await user.tab()

      await waitFor(() => {
        expect(screen.queryByTestId('popup-root')).not.toBeInTheDocument()
        expect(screen.queryByTestId('popup-sub')).not.toBeInTheDocument()
      })
    })
  })

  describe('FocusZone', () => {
    it('cycles from Input through zone tabbables and preserves highlight', async () => {
      const user = userEvent.setup()
      render(<FocusZoneInputMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
      expect(screen.getByRole('option', { name: 'First' })).toHaveAttribute(
        'data-highlighted',
      )

      await user.tab()
      expect(screen.getByTestId('apply')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('cancel')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('input')).toHaveFocus()
      expect(screen.getByTestId('popup')).toBeInTheDocument()

      await user.tab({ shift: true })
      expect(screen.getByTestId('cancel')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      // Arrows are inert while a zone element is focused: the highlight must
      // not advance to the second item.
      expect(screen.getByRole('option', { name: 'First' })).toHaveAttribute(
        'data-highlighted',
      )
      expect(
        screen.getByRole('option', { name: 'Second' }),
      ).not.toHaveAttribute('data-highlighted')
    })

    it('cycles from List through zone tabbables when there is no Input', async () => {
      const user = userEvent.setup()
      render(<FocusZoneListMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
      await user.tab()
      expect(screen.getByTestId('apply')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('cancel')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('list')).toHaveFocus()
      expect(screen.getByTestId('popup')).toBeInTheDocument()
    })

    it('auto-focuses and cycles form-only zone content', async () => {
      const user = userEvent.setup()
      render(<FocusZoneFormMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('first-input')).toHaveFocus(),
      )
      await user.tab()
      expect(screen.getByTestId('second-input')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('submit')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('first-input')).toHaveFocus()
      expect(screen.getByTestId('popup')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      await waitFor(() =>
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
      )
    })

    it('closes on Tab when the zone is empty', async () => {
      const user = userEvent.setup()
      render(<FocusZoneEmptyMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
      await user.tab()
      await waitFor(() =>
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
      )
    })
  })

  describe('Header and Footer', () => {
    it('register as focus zones and expose slot attributes', async () => {
      const user = userEvent.setup()
      render(<HeaderFooterMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

      await user.tab()
      expect(screen.getByTestId('header-btn')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('apply')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('cancel')).toHaveFocus()
      await user.tab()
      expect(screen.getByTestId('input')).toHaveFocus()

      expect(screen.getByTestId('header')).toHaveAttribute(
        'bazzaui-dropdown-menu-header',
        '',
      )
      expect(screen.getByTestId('footer')).toHaveAttribute(
        'bazzaui-dropdown-menu-footer',
        '',
      )
    })

    it('prefers the surface input over a pre-focused header zone tabbable', async () => {
      const user = userEvent.setup()
      render(<PreFocusedHeaderMenu />)

      await waitFor(() =>
        expect(screen.getByTestId('prefocused-input')).toHaveFocus(),
      )
      await user.tab()
      expect(screen.getByTestId('prefocused-header-btn')).toHaveFocus()
    })
  })

  describe('FocusZone submenu bubbling', () => {
    it('bubbles Tab from a first-level zone-less submenu to the first zone tabbable', async () => {
      const user = userEvent.setup()
      render(<FocusZoneSubmenuBubblingMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('input-root')).toHaveFocus(),
      )
      const submenuTrigger = screen.getByTestId('submenu-trigger')
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await user.keyboard('{ArrowRight}')
      await waitFor(() => {
        expect(screen.getByTestId('popup-sub')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      await user.tab()

      await waitFor(() => {
        expect(screen.queryByTestId('popup-sub')).not.toBeInTheDocument()
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
        expect(screen.getByTestId('apply')).toHaveFocus()
        expect(screen.getByTestId('popup-root')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      // The submenu must STAY closed: a keyboard auto-open timer armed before
      // ArrowRight opened the submenu fires ~150ms later and must not reopen it.
      await sleep(200)
      expect(screen.queryByTestId('popup-sub')).not.toBeInTheDocument()
    })

    it('bubbles Shift+Tab from a first-level zone-less submenu to the last zone tabbable', async () => {
      const user = userEvent.setup()
      render(<FocusZoneSubmenuBubblingMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('input-root')).toHaveFocus(),
      )
      const submenuTrigger = screen.getByTestId('submenu-trigger')
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await user.keyboard('{ArrowRight}')
      await waitFor(() => {
        expect(screen.getByTestId('popup-sub')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      await user.tab({ shift: true })

      await waitFor(() => expect(screen.getByTestId('cancel')).toHaveFocus())
    })

    it('bubbles Tab from a second-level zone-less submenu through the submenu chain', async () => {
      const user = userEvent.setup()
      render(<FocusZoneSubmenuBubblingMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('input-root')).toHaveFocus(),
      )
      const submenuTrigger = screen.getByTestId('submenu-trigger')
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await user.keyboard('{ArrowRight}')
      await waitFor(() => {
        expect(screen.getByTestId('popup-sub')).toHaveAttribute(
          'data-focused',
          '',
        )
      })
      const submenuTrigger2 = screen.getByTestId('submenu-trigger-2')
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger2.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await user.keyboard('{ArrowRight}')
      await waitFor(() => {
        expect(screen.getByTestId('popup-sub2')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      await user.tab()

      await waitFor(() => {
        expect(screen.queryByTestId('popup-sub')).not.toBeInTheDocument()
        expect(screen.queryByTestId('popup-sub2')).not.toBeInTheDocument()
        expect(screen.getByTestId('apply')).toHaveFocus()
      })
    })
  })

  describe('focus ownership sync', () => {
    it('follows DOM focus into a surface without stealing it', async () => {
      const user = userEvent.setup()
      render(<FocusOwnershipSyncMenu />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

      const submenuTrigger = screen.getByTestId('submenu-trigger')
      for (let index = 0; index < 3; index += 1) {
        if (submenuTrigger.hasAttribute('data-highlighted')) break
        await user.keyboard('{ArrowDown}')
        await sleep(0)
      }
      await waitFor(() => {
        expect(submenuTrigger).toHaveAttribute('data-highlighted')
      })

      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByTestId('popup-sub')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      act(() => screen.getByTestId('raw-button').focus())

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toHaveAttribute(
          'data-focused',
          '',
        )
      })
      expect(screen.getByTestId('raw-button')).toHaveFocus()

      await new Promise((r) => setTimeout(r, 50))
      expect(screen.getByTestId('raw-button')).toHaveFocus()
    })
  })

  describe('data-focused attribute', () => {
    it('root popup has data-focused when menu opens', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-focused', '')
    })

    it('submenu popup has data-focused when submenu opens', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu by hovering over trigger
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      // Move pointer into submenu to transfer focus
      // Wait a bit after popup opens to bypass the debounce for phantom pointer events
      // (see POINTER_EVENT_DEBOUNCE_MS in constants.ts)
      const submenuPopup = screen.getByTestId('popup-submenu-1')
      await new Promise((r) => setTimeout(r, 150))
      await user.hover(submenuPopup)

      await waitFor(() => {
        expect(submenuPopup).toHaveAttribute('data-focused', '')
      })

      // Root should no longer have data-focused
      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).not.toHaveAttribute('data-focused')
    })
  })

  describe('search input pointer focus', () => {
    const getRootList = () => {
      const rootList = screen
        .getByTestId('root-surface')
        .querySelector('[role="listbox"]')

      if (!(rootList instanceof HTMLElement)) {
        throw new Error('Expected root surface to contain a listbox')
      }

      return rootList
    }

    const hoverOpenSubmenu = async () => {
      fireEvent.pointerEnter(screen.getByTestId('submenu-trigger'), {
        clientX: 10,
        clientY: 10,
      })

      await waitFor(() => {
        expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
      })
    }

    it('does not prevent default on input pointerdown but still prevents list pointerdown', () => {
      render(<MenuWithKeywords />)

      expect(fireEvent.pointerDown(screen.getByTestId('search-input'))).toBe(
        true,
      )
      expect(fireEvent.pointerDown(screen.getByRole('listbox'))).toBe(false)
    })

    it('does not transfer focus when hover-opening a submenu', async () => {
      render(<MenuWithSubmenuInput />)

      const rootList = getRootList()

      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })

      await hoverOpenSubmenu()

      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 150))
      })

      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })
    })

    it('transfers focus when moving the pointer into a submenu surface', async () => {
      render(<MenuWithSubmenuInput />)

      const rootList = getRootList()

      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })

      await hoverOpenSubmenu()

      await act(async () => {
        await new Promise((r) => setTimeout(r, 120))
      })

      fireEvent.pointerMove(screen.getByTestId('submenu-input'), {
        clientX: 200,
        clientY: 20,
      })

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('submenu-input'))
      })
    })

    it('focuses and types into a non-owner submenu input on pointerdown', async () => {
      render(<MenuWithSubmenuInput />)

      const rootList = getRootList()

      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })
      await hoverOpenSubmenu()
      await waitFor(() => {
        expect(document.activeElement).toBe(rootList)
      })

      fireEvent.pointerDown(screen.getByTestId('submenu-input'))

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('submenu-input'))
      })

      await userEvent.keyboard('ap')

      expect(screen.getByTestId('submenu-input')).toHaveValue('ap')
    })
  })

  describe('data-has-open-submenu attribute', () => {
    it('root popup does not have data-has-open-submenu when no submenu is open', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).not.toHaveAttribute('data-has-open-submenu')
    })

    it('root popup has data-has-open-submenu when submenu is open', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')
    })

    it('all parent popups have data-has-open-submenu in deep submenu chain', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open first submenu
      const submenuTrigger1 = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger1)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      // Open second submenu
      const submenuTrigger2 = screen.getByTestId('submenu-trigger-2')
      await user.hover(submenuTrigger2)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-2')).toBeInTheDocument()
      })

      // Root and first submenu should both have data-has-open-submenu
      const rootPopup = screen.getByTestId('popup-root')
      const submenu1Popup = screen.getByTestId('popup-submenu-1')
      const submenu2Popup = screen.getByTestId('popup-submenu-2')

      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')
      expect(submenu1Popup).toHaveAttribute('data-has-open-submenu', '')
      // Deepest submenu should NOT have data-has-open-submenu
      expect(submenu2Popup).not.toHaveAttribute('data-has-open-submenu')
    })

    it('removes data-has-open-submenu when submenu closes', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu using pointer events with explicit coordinates
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.pointer([
        { target: submenuTrigger, coords: { x: 100, y: 50 } },
      ])

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')

      // Wait for aim guard debounce to settle
      await new Promise((r) => setTimeout(r, 150))

      // Move back to root item to close submenu - use explicit coordinates
      // that are different from the previous position to trigger movement detection
      const rootItem = screen.getByTestId('root-item-1')
      await user.pointer([{ target: rootItem, coords: { x: 100, y: 20 } }])

      await waitFor(() => {
        expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
      })

      // Root should no longer have data-has-open-submenu
      expect(rootPopup).not.toHaveAttribute('data-has-open-submenu')
    })
  })

  describe('submenu safe triangle debug visualization', () => {
    const getSafeTriangle = (tone?: string) => {
      const selector = tone
        ? `[data-bazzaui-submenu-safe-triangle-area][data-safe-triangle-tone="${tone}"]`
        : '[data-bazzaui-submenu-safe-triangle-area]'

      return document.querySelector(selector)
    }

    it('does not render the safe triangle when debug mode is disabled', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      await user.hover(screen.getByTestId('submenu-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      expect(getSafeTriangle()).toBeNull()
    })

    it('renders the safe triangle in blue while hovering a submenu trigger', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 90 })

      await waitFor(() => {
        expect(getSafeTriangle('hover')).toBeInTheDocument()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('supports object config for safe triangle look customization', async () => {
      const user = userEvent.setup()
      render(
        <NestedMenuForDataAttrs
          debug={{
            showSafeTriangleArea: {
              enabled: true,
              idleColor: '#ff0088',
              triangleFillOpacity: 0.35,
              overlayOpacity: 0.7,
              showStroke: false,
              showDots: false,
            },
          }}
        />,
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 90 })

      let hoverTriangle: Element | null = null

      await waitFor(() => {
        hoverTriangle = getSafeTriangle('hover')
        expect(hoverTriangle).toBeInTheDocument()
      })

      const polygon = hoverTriangle?.querySelector('polygon')
      expect(polygon?.getAttribute('fill')).toBe('#ff0088')
      expect(polygon?.getAttribute('fill-opacity')).toBe('0.35')
      expect(polygon?.getAttribute('stroke')).toBe('none')
      expect(hoverTriangle?.querySelectorAll('circle')).toHaveLength(0)
      expect((hoverTriangle as SVGSVGElement | null)?.style.opacity).toBe('0.7')

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('shows hover safe triangle for nested submenu trigger while parent guard is active', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger1 = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger1)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup1 = screen.getByTestId('popup-submenu-1')
      const trigger1RectSpy = vi
        .spyOn(submenuTrigger1, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popup1RectSpy = vi
        .spyOn(submenuPopup1, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      try {
        // Activate aim guard for the root submenu trigger.
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })
        fireEvent.pointerLeave(submenuTrigger1, { clientX: 190, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

        await waitFor(() => {
          expect(getSafeTriangle('activated')).toBeInTheDocument()
        })

        const submenuTrigger2 = screen.getByTestId('submenu-trigger-2')

        fireEvent.pointerEnter(submenuTrigger2, {
          pointerType: 'mouse',
          clientX: 270,
          clientY: 95,
        })
        fireEvent.pointerMove(submenuTrigger2, {
          pointerType: 'mouse',
          clientX: 270,
          clientY: 95,
        })

        await waitFor(() => {
          expect(screen.getByTestId('popup-submenu-2')).toBeInTheDocument()
        })

        const submenuPopup2 = screen.getByTestId('popup-submenu-2')
        const trigger2RectSpy = vi
          .spyOn(submenuTrigger2, 'getBoundingClientRect')
          .mockImplementation(() =>
            createRect({ top: 90, left: 250, width: 120, height: 30 }),
          )
        const popup2RectSpy = vi
          .spyOn(submenuPopup2, 'getBoundingClientRect')
          .mockImplementation(() =>
            createRect({ top: 70, left: 430, width: 180, height: 160 }),
          )

        try {
          // Force a position update after geometry overrides are in place.
          fireEvent.pointerMove(window, {
            pointerType: 'mouse',
            clientX: 270,
            clientY: 95,
          })

          await waitFor(() => {
            expect(getSafeTriangle('hover')).toBeInTheDocument()
          })
        } finally {
          trigger2RectSpy.mockRestore()
          popup2RectSpy.mockRestore()
        }
      } finally {
        trigger1RectSpy.mockRestore()
        popup1RectSpy.mockRestore()
      }
    })

    it('renders the safe triangle in green when aim guard is activated on leave', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
      fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

      await waitFor(() => {
        expect(getSafeTriangle('activated')).toBeInTheDocument()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('keeps the activated safe triangle after moving into submenu popup', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
      fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

      let frozenStyle = ''

      await waitFor(() => {
        const activatedTriangle = getSafeTriangle(
          'activated',
        ) as HTMLElement | null

        expect(activatedTriangle).toBeInTheDocument()
        frozenStyle = activatedTriangle?.style.cssText ?? ''
      })

      fireEvent.pointerMove(submenuPopup, { clientX: 300, clientY: 120 })

      await waitFor(() => {
        const activatedTriangleAfterMove = getSafeTriangle(
          'activated',
        ) as HTMLElement | null

        expect(activatedTriangleAfterMove).toBeInTheDocument()
        expect(activatedTriangleAfterMove?.style.cssText).toBe(frozenStyle)
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('immediately hides the safe triangle when aim guard is not activated', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      await waitFor(() => {
        expect(getSafeTriangle('hover')).toBeInTheDocument()
      })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
      fireEvent.pointerMove(window, { clientX: 130, clientY: 260 })

      await waitFor(() => {
        expect(getSafeTriangle()).toBeNull()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('shows red missed triangle and hides it after configured miss freeze duration', async () => {
      const user = userEvent.setup()
      render(
        <NestedMenuForDataAttrs
          debug={{
            showSafeTriangleArea: {
              enabled: true,
              showMissState: true,
              missColor: '#ff4d4f',
              missFreezeDuration: 140,
            },
          }}
        />,
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
      fireEvent.pointerMove(window, { clientX: 130, clientY: 260 })

      let missedTriangle: Element | null = null

      await waitFor(() => {
        missedTriangle = getSafeTriangle('missed')
        expect(missedTriangle).toBeInTheDocument()
      })

      const polygon = missedTriangle?.querySelector('polygon')
      expect(polygon?.getAttribute('fill')).toBe('#ff4d4f')

      await waitFor(
        () => {
          expect(getSafeTriangle('missed')).toBeNull()
        },
        { timeout: 700 },
      )

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })
  })

  describe('submenu closeDelay', () => {
    const setupCloseDelayScenario = async (closeDelay: number) => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs submenuCloseDelay={closeDelay} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      return {
        user,
        submenuTrigger,
        submenuPopup,
        cleanup: () => {
          triggerRectSpy.mockRestore()
          popupRectSpy.mockRestore()
        },
      }
    }

    const fireMissTrajectory = (submenuTrigger: HTMLElement) => {
      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
    }

    it('closes immediately on miss when closeDelay is 0', async () => {
      const scenario = await setupCloseDelayScenario(0)

      try {
        fireMissTrajectory(scenario.submenuTrigger)

        await waitFor(() => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        })
      } finally {
        scenario.cleanup()
      }
    })

    it('reopens the submenu when the pointer re-enters the trigger after a miss close', async () => {
      const scenario = await setupCloseDelayScenario(0)

      try {
        fireMissTrajectory(scenario.submenuTrigger)

        await waitFor(() => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        })

        // Re-enter the same trigger (coordinates inside the mocked trigger rect)
        fireEvent.pointerEnter(scenario.submenuTrigger, {
          clientX: 100,
          clientY: 75,
        })
        fireEvent.pointerMove(scenario.submenuTrigger, {
          clientX: 102,
          clientY: 76,
        })

        await waitFor(() => {
          expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
        })
      } finally {
        scenario.cleanup()
      }
    })

    it('delays close on miss when closeDelay is greater than 0', async () => {
      const scenario = await setupCloseDelayScenario(160)

      try {
        fireMissTrajectory(scenario.submenuTrigger)

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        await waitFor(
          () => {
            expect(
              screen.queryByTestId('popup-submenu-1'),
            ).not.toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('cancels delayed close when pointer re-enters the trigger', async () => {
      const scenario = await setupCloseDelayScenario(220)

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        await scenario.user.hover(scenario.submenuTrigger)

        await waitFor(
          () => {
            expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('cancels delayed close when pointer enters the submenu popup', async () => {
      const scenario = await setupCloseDelayScenario(220)

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        fireEvent.pointerEnter(scenario.submenuPopup, {
          clientX: 300,
          clientY: 120,
        })
        fireEvent.pointerMove(scenario.submenuPopup, {
          clientX: 300,
          clientY: 120,
        })

        await waitFor(
          () => {
            expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })
  })

  describe('submenu closeOnPointerLeave', () => {
    const setupScenario = async (closeDelay = 0) => {
      const user = userEvent.setup()
      render(
        <NestedMenuForDataAttrs
          submenuCloseOnPointerLeave={false}
          submenuCloseDelay={closeDelay}
        />,
      )

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)
      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      return {
        user,
        submenuTrigger,
        cleanup: () => {
          triggerRectSpy.mockRestore()
          popupRectSpy.mockRestore()
        },
      }
    }

    const fireMissTrajectory = (submenuTrigger: HTMLElement) => {
      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })
      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
    }

    it('keeps the submenu open on a miss when closeOnPointerLeave is false', async () => {
      const scenario = await setupScenario()

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        await new Promise((r) => setTimeout(r, 300))
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      } finally {
        scenario.cleanup()
      }
    })

    it('still closes when a sibling item is highlighted', async () => {
      const scenario = await setupScenario()

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        // Prove the miss itself did not close it, so the removal below is
        // attributable to the sibling highlight.
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        const rootItem = screen.getByTestId('root-item-1')
        fireEvent.pointerEnter(rootItem, { clientX: 100, clientY: 20 })
        fireEvent.pointerMove(rootItem, { clientX: 102, clientY: 22 })

        await waitFor(() => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        })
      } finally {
        scenario.cleanup()
      }
    })

    it('stops the leave monitor after a reversal so a sibling highlight is not undone (closeDelay > 0)', async () => {
      const scenario = await setupScenario(240)

      try {
        // Initial hit trajectory toward the submenu → leave monitor starts
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })
        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        // Reverse away from the submenu → miss; with closeOnPointerLeave=false
        // the popup must stay open, and the monitor must be torn down.
        fireEvent.pointerMove(window, { clientX: 178, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 164, clientY: 94 })
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        // Highlight a sibling → closes the submenu via closeSiblingSubmenus.
        const rootItem = screen.getByTestId('root-item-1')
        fireEvent.pointerEnter(rootItem, { clientX: 96, clientY: 74 })
        fireEvent.pointerMove(rootItem, { clientX: 100, clientY: 78 })

        await waitFor(() => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        })

        // A stale monitor could re-evaluate a later move as a "hit" and reopen
        // the submenu / steal the highlight back. Move toward where the popup
        // was and confirm the sibling highlight and closed state are stable.
        fireEvent.pointerMove(window, { clientX: 200, clientY: 100 })
        fireEvent.pointerMove(window, { clientX: 230, clientY: 110 })
        await sleep(300)

        expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
        expect(rootItem).toHaveAttribute('data-highlighted', '')
      } finally {
        scenario.cleanup()
      }
    })
  })

  describe('submenu explicit close suppression', () => {
    it('does not reopen on pointer enter after ArrowLeft closes the submenu', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      const rootList = screen.getByRole('listbox')
      rootList.focus()

      // Navigate to the submenu trigger (fixture order: root-item-1, then submenu-trigger-1)
      await user.keyboard('{ArrowDown}')
      if (!submenuTrigger.hasAttribute('data-highlighted')) {
        await user.keyboard('{ArrowDown}')
      }
      await waitFor(() => {
        expect(submenuTrigger).toHaveAttribute('data-highlighted')
      })

      // Keyboard highlight auto-opens the submenu after the keyboard delay
      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowRight}')

      // Explicit keyboard open transfers focus into the submenu so ArrowLeft closes it.
      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toHaveAttribute(
          'data-focused',
          '',
        )
      })

      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
      })
      expect(submenuTrigger).toHaveAttribute('data-highlighted')

      // Pointer re-enter while the trigger is still highlighted must NOT reopen
      fireEvent.pointerEnter(submenuTrigger, { clientX: 100, clientY: 75 })
      fireEvent.pointerMove(submenuTrigger, { clientX: 102, clientY: 76 })

      await sleep(200)
      expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
    })
  })

  describe('aim guard lifecycle', () => {
    it('clears aim guard when the root menu closes', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.queryByTestId('popup-root')).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-root')).toBeInTheDocument()
        })

        const rootItem = screen.getByTestId('root-item-1')

        fireEvent.pointerMove(rootItem, { clientX: 96, clientY: 74 })
        fireEvent.pointerMove(rootItem, { clientX: 100, clientY: 78 })

        await waitFor(
          () => {
            expect(rootItem).toHaveAttribute('data-highlighted', '')
          },
          { timeout: 250 },
        )
      } finally {
        triggerRectSpy.mockRestore()
        popupRectSpy.mockRestore()
      }
    })
  })

  describe('aim guard debug logging', () => {
    const getAimGuardLogMessages = (logSpy: ReturnType<typeof vi.spyOn>) =>
      logSpy.mock.calls
        .map(([firstArg]) => (typeof firstArg === 'string' ? firstArg : ''))
        .filter((message) => message.startsWith('[PopupMenu][AimGuard'))

    it('does not log aim guard events by default', async () => {
      const user = userEvent.setup()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      let unmount: (() => void) | null = null

      try {
        unmount = render(<NestedMenuForDataAttrs />).unmount

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-root')).toBeInTheDocument()
        })

        await user.hover(screen.getByTestId('submenu-trigger-1'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
        })

        expect(getAimGuardLogMessages(logSpy)).toHaveLength(0)
      } finally {
        unmount?.()
        logSpy.mockRestore()
      }
    })

    it('logs aim guard events when logAimGuardEvents is enabled', async () => {
      const user = userEvent.setup()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      let unmount: (() => void) | null = null

      try {
        unmount = render(
          <NestedMenuForDataAttrs debug={{ logAimGuardEvents: true }} />,
        ).unmount

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-root')).toBeInTheDocument()
        })

        await user.hover(screen.getByTestId('submenu-trigger-1'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
        })

        const messages = getAimGuardLogMessages(logSpy)

        expect(
          messages.some((message) =>
            message.startsWith('[PopupMenu][AimGuardProvider]'),
          ),
        ).toBe(true)
        expect(
          messages.some((message) =>
            message.startsWith('[PopupMenu][AimGuard]'),
          ),
        ).toBe(true)
      } finally {
        unmount?.()
        logSpy.mockRestore()
      }
    })
  })

  describe('pointer modality gating', () => {
    it('does not open submenu on touch pointer hover events', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      fireEvent.pointerEnter(submenuTrigger, {
        pointerType: 'touch',
        clientX: 190,
        clientY: 94,
      })
      fireEvent.pointerMove(submenuTrigger, {
        pointerType: 'touch',
        clientX: 190,
        clientY: 94,
      })

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        },
        { timeout: 250 },
      )
    })

    it('still opens submenu on pen pointer hover events', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      fireEvent.pointerEnter(submenuTrigger, {
        pointerType: 'pen',
        clientX: 190,
        clientY: 94,
      })
      fireEvent.pointerMove(submenuTrigger, {
        pointerType: 'pen',
        clientX: 190,
        clientY: 94,
      })

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })
    })
  })

  describe('continuous aim monitoring', () => {
    const setupAimMonitoringScenario = async (closeDelay: number) => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs submenuCloseDelay={closeDelay} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      return {
        submenuTrigger,
        cleanup: () => {
          triggerRectSpy.mockRestore()
          popupRectSpy.mockRestore()
        },
      }
    }

    it('closes when pointer intent changes away after an initial hit', async () => {
      const scenario = await setupAimMonitoringScenario(0)

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        fireEvent.pointerMove(window, { clientX: 140, clientY: 250 })
        fireEvent.pointerMove(window, { clientX: 110, clientY: 275 })

        await waitFor(
          () => {
            expect(
              screen.queryByTestId('popup-submenu-1'),
            ).not.toBeInTheDocument()
          },
          { timeout: 350 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('keeps submenu open when intent switches toward submenu before delayed close', async () => {
      const scenario = await setupAimMonitoringScenario(240)

      try {
        fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
        fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
        fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 130,
          clientY: 260,
        })

        fireEvent.pointerMove(window, { clientX: 170, clientY: 200 })
        fireEvent.pointerMove(window, { clientX: 210, clientY: 170 })
        fireEvent.pointerMove(window, { clientX: 250, clientY: 140 })

        await sleep(300)

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      } finally {
        scenario.cleanup()
      }
    })

    it('drops aim guard immediately when pointer reverses direction after a hit', async () => {
      const scenario = await setupAimMonitoringScenario(0)

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })

        fireEvent.pointerMove(window, { clientX: 178, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 164, clientY: 94 })

        const rootItem = screen.getByTestId('root-item-1')
        fireEvent.pointerMove(rootItem, { clientX: 96, clientY: 74 })
        fireEvent.pointerMove(rootItem, { clientX: 100, clientY: 78 })

        await waitFor(
          () => {
            expect(rootItem).toHaveAttribute('data-highlighted', '')
          },
          { timeout: 250 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('opens sibling submenu on pointermove after guard timeout', async () => {
      const scenario = await setupAimMonitoringScenario(0)

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })

        const siblingTrigger = screen.getByTestId('submenu-trigger-sibling')

        fireEvent.pointerEnter(siblingTrigger, {
          clientX: 182,
          clientY: 136,
        })
        fireEvent.pointerMove(siblingTrigger, {
          clientX: 182,
          clientY: 136,
        })

        expect(
          screen.queryByTestId('popup-submenu-sibling'),
        ).not.toBeInTheDocument()

        await sleep(650)

        fireEvent.pointerMove(siblingTrigger, {
          clientX: 186,
          clientY: 140,
        })

        await waitFor(() => {
          expect(
            screen.getByTestId('popup-submenu-sibling'),
          ).toBeInTheDocument()
        })
      } finally {
        scenario.cleanup()
      }
    })

    it('does not reopen submenu on pointermove after explicit click close until pointer leaves', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      await user.click(submenuTrigger)

      await waitFor(() => {
        expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
      })

      fireEvent.pointerMove(submenuTrigger, { clientX: 182, clientY: 92 })
      fireEvent.pointerMove(submenuTrigger, { clientX: 186, clientY: 94 })

      await sleep(120)

      expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()

      const rootItem = screen.getByTestId('root-item-1')
      await user.hover(rootItem)
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })
    })
  })

  describe('search and filtering', () => {
    it('filters items by keyword search', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'fruit')

      // Apple and Banana have 'fruit' keyword, Carrot doesn't
      // Filtered-out items are removed from DOM entirely
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-carrot')).not.toBeInTheDocument()
    })

    it('filters items by specific keyword', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'vegetable')

      // Only Carrot has 'vegetable' keyword
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-carrot')).toBeInTheDocument()
    })

    it('filters checkbox items by value', async () => {
      const user = userEvent.setup()
      render(
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface data-testid="surface">
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <DropdownMenu.CheckboxItem
                      data-testid="item-checkbox"
                      value="zulu"
                    >
                      Enable minimap
                    </DropdownMenu.CheckboxItem>
                    <DropdownMenu.Item data-testid="item-sibling" value="apple">
                      Apple
                    </DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'zulu')

      expect(screen.getByTestId('item-checkbox')).toBeInTheDocument()
      expect(screen.queryByTestId('item-sibling')).not.toBeInTheDocument()
    })

    it('shows empty state when no items match', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'xyz123notfound')

      // All items should be removed
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-carrot')).not.toBeInTheDocument()

      // Empty state should be visible
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('shows all items when search is cleared', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')

      // Type to filter - only Carrot has 'vegetable'
      await user.type(input, 'vegetable')
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()

      // Clear input
      await user.clear(input)

      // All items should be back
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-carrot')).toBeInTheDocument()
    })
  })

  describe('filter={false}', () => {
    it('does not filter items when filter is disabled', async () => {
      const user = userEvent.setup()
      render(<MenuWithFilterDisabled />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'xyz123notfound')

      // All items should still be in DOM (no filtering)
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()

      // Empty state should not be shown since items exist
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  // Note: Search isolation across nested surfaces tests removed due to complexity.
  // The submenu triggers get filtered along with regular items, making it difficult
  // to test search isolation when the parent surface has a search filter active.
  // This behavior should be tested manually or in E2E tests.

  describe('controlled search', () => {
    it('uses controlled search value from Surface', async () => {
      const onSearchChange = vi.fn()
      const { rerender } = render(
        <MenuWithControlledSearch
          search="app"
          onSearchChange={onSearchChange}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should display controlled value
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('app')

      // Only apple should match "app"
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()

      // Update controlled value
      rerender(
        <MenuWithControlledSearch
          search="cherry"
          onSearchChange={onSearchChange}
        />,
      )

      // Now cherry should match
      expect(input).toHaveValue('cherry')
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('calls onSearchChange when user types', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(
        <MenuWithControlledSearch search="" onSearchChange={onSearchChange} />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'b')

      // onSearchChange should have been called
      expect(onSearchChange).toHaveBeenCalledWith('b')
    })
  })

  describe('highlight close lifecycle', () => {
    it('preserves highlight during exit and resets to auto-highlight when reopening during exit', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()
      const originalGetAnimations = Element.prototype.getAnimations
      const pendingExitAnimation = new Promise<Animation>(() => {})

      Object.defineProperty(Element.prototype, 'getAnimations', {
        configurable: true,
        value(this: Element) {
          if (
            this.classList.contains('popup-menu-highlight-lifecycle-test') &&
            this.hasAttribute('data-ending-style')
          ) {
            return [
              {
                finished: pendingExitAnimation,
                pending: true,
                playState: 'running',
              },
            ]
          }

          return []
        },
      })

      try {
        render(
          <>
            <style>{`
              @keyframes popup-menu-highlight-lifecycle-test {
                from { opacity: 1; }
                to { opacity: 0; }
              }

              .popup-menu-highlight-lifecycle-test[data-ending-style] {
                animation: popup-menu-highlight-lifecycle-test 10s linear;
              }
            `}</style>
            <MenuWithHighlightLifecycle
              onOpenChangeComplete={onOpenChangeComplete}
            />
          </>,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )

        const list = screen.getByTestId('list')
        list.focus()
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowDown}')

        expect(screen.getByTestId('item-cherry')).toHaveAttribute(
          'data-highlighted',
        )

        await user.keyboard('{Escape}')

        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style')
        expect(screen.getByTestId('item-cherry')).toHaveAttribute(
          'data-highlighted',
        )
        expect(onOpenChangeComplete).not.toHaveBeenCalledWith(false)

        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('item-apple')).toHaveAttribute(
            'data-highlighted',
          )
        })
        expect(screen.getByTestId('item-cherry')).not.toHaveAttribute(
          'data-highlighted',
        )
      } finally {
        if (originalGetAnimations) {
          Object.defineProperty(Element.prototype, 'getAnimations', {
            configurable: true,
            value: originalGetAnimations,
          })
        } else {
          delete Element.prototype.getAnimations
        }
      }
    })
  })

  describe('clearSearchOnClose', () => {
    it('clears search when menu closes (default behavior)', async () => {
      const user = userEvent.setup()
      render(<MenuWithClearSearchOnClose clearSearchOnClose={true} />)

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be cleared
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('')

      // All items should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('preserves search when clearSearchOnClose is false', async () => {
      const user = userEvent.setup()
      render(<MenuWithClearSearchOnClose clearSearchOnClose={false} />)

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be preserved
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('apple')

      // Only apple should be visible (filter still applied)
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('clears search after exit animation when clearSearchOnClose is "after-exit"', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()
      render(
        <MenuWithClearSearchOnClose
          clearSearchOnClose="after-exit"
          onOpenChangeComplete={onOpenChangeComplete}
        />,
      )

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Only apple should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()

      // Close menu
      await user.keyboard('{Escape}')

      // Wait for menu to close and onOpenChangeComplete to be called
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // onOpenChangeComplete should have been called with false
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be cleared (cleared after animation completed)
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('')

      // All items should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('calls onOpenChangeComplete after animation completes', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()
      render(
        <MenuWithClearSearchOnClose
          clearSearchOnClose="after-exit"
          onOpenChangeComplete={onOpenChangeComplete}
        />,
      )

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // onOpenChangeComplete should be called with true after open animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(true)
      })

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // onOpenChangeComplete should be called with false after close animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })

      // Should have been called twice total (open and close)
      expect(onOpenChangeComplete).toHaveBeenCalledTimes(2)
    })
  })

  describe('hideUntilActive', () => {
    it('hides input initially when hideUntilActive is true', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // List should be rendered and focusable
      expect(screen.getByTestId('list')).toBeInTheDocument()
    })

    it('activates input when user types a character', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // Focus the list and type a character
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('a')

      // Input should now be rendered
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Input should have the typed character
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('a')
    })

    it('filters items after input is activated', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the list and type to activate + filter
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('ban')

      // Wait for input to appear
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Input should have the typed characters
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('ban')

      // Only banana should match
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('does not activate input on navigation keys', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the list
      const list = screen.getByTestId('list')
      list.focus()

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      // Input should still not be rendered
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // Items should still be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })
  })

  describe('non-activatable items', () => {
    function TestMenu({
      onHeaderSelect,
      onItemSelect,
      headerFirst = true,
    }: {
      onHeaderSelect?: () => void
      onItemSelect?: () => void
      headerFirst?: boolean
    }) {
      const header = (
        <DropdownMenu.Item
          key="header"
          data-testid="header"
          value="header"
          activatable={false}
          onSelect={onHeaderSelect}
        >
          Header
        </DropdownMenu.Item>
      )
      const item = (
        <DropdownMenu.Item
          key="item"
          data-testid="item"
          value="item"
          onSelect={onItemSelect}
        >
          Item
        </DropdownMenu.Item>
      )

      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger data-testid="trigger">
            Open Menu
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface data-testid="surface">
                  <DropdownMenu.List data-testid="list">
                    {headerFirst ? [header, item] : [item, header]}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('keeps non-activatable items in keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<TestMenu headerFirst={false} />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      screen.getByTestId('list').focus()
      await user.keyboard('{ArrowDown}')

      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })

    it('does not activate or close when Enter is pressed on a non-activatable item', async () => {
      const user = userEvent.setup()
      const onHeaderSelect = vi.fn()
      render(<TestMenu onHeaderSelect={onHeaderSelect} />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      screen.getByTestId('list').focus()
      await user.keyboard('{Enter}')

      expect(onHeaderSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    it('does not activate or close when a non-activatable item is clicked', async () => {
      const user = userEvent.setup()
      const onHeaderSelect = vi.fn()
      render(<TestMenu onHeaderSelect={onHeaderSelect} />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('header'))

      expect(onHeaderSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    it('still activates normal items via Enter and click', async () => {
      const user = userEvent.setup()
      const onItemSelect = vi.fn()
      render(<TestMenu onItemSelect={onItemSelect} />)

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      screen.getByTestId('list').focus()
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item'))

      expect(onItemSelect).toHaveBeenCalledTimes(2)
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })
  })

  describe('tree parts', () => {
    function TreeMenu({ includeInput = false }: { includeInput?: boolean }) {
      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger data-testid="trigger">
            Open Menu
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface data-testid="surface">
                  {includeInput ? (
                    <DropdownMenu.Input data-testid="input" />
                  ) : null}
                  <DropdownMenu.List data-testid="list">
                    <DropdownMenu.TreeItem data-testid="parent">
                      Parent
                    </DropdownMenu.TreeItem>
                    <DropdownMenu.Tree>
                      <DropdownMenu.TreeItem
                        data-testid="child-a"
                        value="child a"
                      >
                        Child A
                      </DropdownMenu.TreeItem>
                      <DropdownMenu.TreeItem
                        data-testid="child-b"
                        value="child b"
                      >
                        Child B
                      </DropdownMenu.TreeItem>
                      <DropdownMenu.Tree>
                        <DropdownMenu.TreeItem
                          data-testid="grandchild"
                          value="grandchild"
                        >
                          Grandchild
                        </DropdownMenu.TreeItem>
                      </DropdownMenu.Tree>
                    </DropdownMenu.Tree>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('sets tree depths and CSS variables from nested Tree context', async () => {
      const user = userEvent.setup()
      render(<TreeMenu />)
      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('surface')).toBeInTheDocument(),
      )

      for (const [testId, depth] of [
        ['parent', '0'],
        ['child-a', '1'],
        ['child-b', '1'],
        ['grandchild', '2'],
      ]) {
        const item = screen.getByTestId(testId)
        expect(item).toHaveAttribute('data-depth', depth)
        expect(item).toHaveStyle(`--tree-depth: ${depth}`)
      }
    })

    it('supports non-selectable header rows', async () => {
      const user = userEvent.setup()
      const onHeaderSelect = vi.fn()
      render(
        <DropdownMenu.Root>
          <DropdownMenu.Trigger data-testid="trigger">
            Open Menu
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface data-testid="surface">
                  <DropdownMenu.List data-testid="list">
                    <DropdownMenu.TreeItem data-testid="item">
                      Item
                    </DropdownMenu.TreeItem>
                    <DropdownMenu.TreeItem
                      data-testid="header"
                      selectable={false}
                      onSelect={onHeaderSelect}
                    >
                      Header
                    </DropdownMenu.TreeItem>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>,
      )

      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('surface')).toBeInTheDocument(),
      )
      expect(screen.getByTestId('header')).toHaveAttribute('data-header', '')

      screen.getByTestId('list').focus()
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-highlighted',
        '',
      )
      await user.keyboard('{Enter}')
      expect(onHeaderSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('surface')).toBeInTheDocument()

      await user.click(screen.getByTestId('header'))
      expect(onHeaderSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    it('filters tree items through Input', async () => {
      const user = userEvent.setup()
      render(<TreeMenu includeInput />)
      await user.click(screen.getByTestId('trigger'))
      await waitFor(() =>
        expect(screen.getByTestId('surface')).toBeInTheDocument(),
      )

      await user.type(screen.getByTestId('input'), 'child b')
      expect(screen.queryByTestId('child-a')).not.toBeInTheDocument()
      expect(screen.getByTestId('child-b')).toBeInTheDocument()
    })
  })

  describe('navigation order after partial remounts', () => {
    function RemountFixture({
      remountSecond,
      remountFirst = false,
    }: {
      remountSecond: boolean
      remountFirst?: boolean
    }) {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  <DropdownMenu.Input data-testid="order-input" />
                  <DropdownMenu.List>
                    <DropdownMenu.Item
                      key={remountFirst ? 'one-b' : 'one-a'}
                      id="one"
                      onSelect={() => {}}
                    >
                      One
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      key={remountSecond ? 'two-b' : 'two-a'}
                      id="two"
                      onSelect={() => {}}
                    >
                      Two
                    </DropdownMenu.Item>
                    <DropdownMenu.Item id="three" onSelect={() => {}}>
                      Three
                    </DropdownMenu.Item>
                    <DropdownMenu.Item id="four" onSelect={() => {}}>
                      Four
                    </DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('keeps DOM order after one item remounts while open', async () => {
      // Registration order (Map insertion) drifts from DOM order when a
      // subset of items remounts (Fast Refresh re-running effects, Suspense
      // retries, key changes). Navigation must follow DOM order regardless.
      const user = userEvent.setup()
      const { rerender } = render(<RemountFixture remountSecond={false} />)

      await waitFor(() =>
        expect(screen.getByTestId('order-input')).toHaveFocus(),
      )

      // Simulate a partial remount: item "Two" changes identity and
      // re-registers with the store while the menu stays open.
      rerender(<RemountFixture remountSecond />)

      // "One" is auto-highlighted on open; navigation starts from it.
      await waitFor(() =>
        expect(document.querySelector('[data-highlighted]')?.textContent).toBe(
          'One',
        ),
      )

      const order: (string | null | undefined)[] = []
      for (let i = 0; i < 3; i++) {
        await user.keyboard('{ArrowDown}')
        order.push(document.querySelector('[data-highlighted]')?.textContent)
      }

      expect(order).toEqual(['Two', 'Three', 'Four'])
    })

    it('auto-highlights the DOM-first match after the first item remounts', async () => {
      // validateHighlight picks the auto-highlight target on refilter. It must
      // agree with the DOM-ordered navigation, not registration order.
      const user = userEvent.setup()
      const { rerender } = render(<RemountFixture remountSecond={false} />)

      await waitFor(() =>
        expect(screen.getByTestId('order-input')).toHaveFocus(),
      )

      // Remount the visually-first item so registration order becomes
      // Two, Three, Four, One while DOM order stays One, Two, Three, Four.
      rerender(<RemountFixture remountSecond={false} remountFirst />)

      // "o" matches One, Two, and Four — auto-highlight must pick the
      // DOM-first match ("One"), not the registration-first one ("Two").
      await user.type(screen.getByTestId('order-input'), 'o')

      await waitFor(() =>
        expect(document.querySelector('[data-highlighted]')?.textContent).toBe(
          'One',
        ),
      )
    })
  })
})
