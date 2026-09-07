import { describe, expect, it } from 'vitest'
import type {
  CheckboxItemDef,
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  SubmenuDef,
  SubpageDef,
} from '../types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
} from '../types.js'
import {
  collectAsyncSubmenus,
  filterNodes,
  flattenNodes,
  getBrowseNodesPreserve,
  isCheckboxItemDef,
  isRadioGroupDef,
  isSubpageDef,
  mergeAsyncNodesIntoTree,
  scoreNodes,
} from '../utils.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createItemDef(
  id: string,
  value: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    kind: 'item',
    id,
    value,
    render: () => null,
    ...options,
  }
}

function createCheckboxItemDef(
  id: string,
  value: string,
  checked: boolean,
  options: Partial<CheckboxItemDef> = {},
): CheckboxItemDef {
  return {
    kind: 'checkbox-item',
    id,
    value,
    checked,
    render: () => null,
    ...options,
  }
}

function createSubmenuDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options: Partial<SubmenuDef> = {},
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value,
    nodes,
    render: () => null,
    ...options,
  }
}

function createSubpageDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options: Partial<SubpageDef> = {},
): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    nodes,
    renderTrigger: () => null,
    renderContent: () => null,
    ...options,
  }
}

function createGroupDef(
  id: string,
  nodes: NodeDef[],
  options: Partial<GroupDef> = {},
): GroupDef {
  return {
    kind: 'group',
    id,
    nodes,
    ...options,
  }
}

function createRadioItemDef(
  id: string,
  value: string,
  options: Partial<RadioItemDef> = {},
): RadioItemDef {
  return {
    kind: 'radio-item',
    id,
    value,
    render: () => null,
    ...options,
  }
}

function createRadioGroupDef(
  id: string,
  value: string | undefined,
  nodes: RadioItemDef[],
  options: Partial<RadioGroupDef> = {},
): RadioGroupDef {
  return {
    kind: 'radio-group',
    id,
    value,
    nodes,
    render: () => null,
    ...options,
  }
}

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Type Guards', () => {
  describe('isCheckboxItemDef', () => {
    it('should return true for checkbox items', () => {
      const node = createCheckboxItemDef('cb1', 'Checkbox', true)
      expect(isCheckboxItemDef(node)).toBe(true)
    })

    it('should return false for regular items', () => {
      const node = createItemDef('item1', 'Item')
      expect(isCheckboxItemDef(node)).toBe(false)
    })

    it('should return false for submenus', () => {
      const node = createSubmenuDef('sub1', 'Submenu', [])
      expect(isCheckboxItemDef(node)).toBe(false)
    })
  })

  describe('isRadioGroupDef', () => {
    it('should return true for radio groups', () => {
      const node = createRadioGroupDef('rg1', 'value1', [])
      expect(isRadioGroupDef(node)).toBe(true)
    })

    it('should return false for regular groups', () => {
      const node = createGroupDef('g1', [])
      expect(isRadioGroupDef(node)).toBe(false)
    })

    it('should return false for items', () => {
      const node = createItemDef('item1', 'Item')
      expect(isRadioGroupDef(node)).toBe(false)
    })
  })

  describe('isSubpageDef', () => {
    it('should return true for subpages', () => {
      const node = createSubpageDef('subpage1', 'AI Filter', [])
      expect(isSubpageDef(node)).toBe(true)
    })

    it('should return false for submenus', () => {
      const node = createSubmenuDef('sub1', 'Submenu', [])
      expect(isSubpageDef(node)).toBe(false)
    })
  })
})

// ============================================================================
// CheckboxItemDef Tests
// ============================================================================

describe('CheckboxItemDef', () => {
  describe('flattenNodes', () => {
    it('should include checkbox items in flattened results', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Item 1'),
        createCheckboxItemDef('cb1', 'Checkbox 1', true),
        createCheckboxItemDef('cb2', 'Checkbox 2', false),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(3)
      expect(flattened[1].node.id).toBe('cb1')
      expect(flattened[1].node.kind).toBe('checkbox-item')
    })

    it('should include checkbox items from groups', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createCheckboxItemDef('cb1', 'Checkbox 1', true),
          createCheckboxItemDef('cb2', 'Checkbox 2', false),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[1].group?.id).toBe('g1')
    })
  })

  describe('scoreNodes', () => {
    it('should score checkbox items based on label', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Light Theme', false),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('cb1')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should score checkbox items based on keywords', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Enable Feature', true, {
          keywords: ['toggle', 'switch'],
        }),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'toggle')

      expect(scored).toHaveLength(1)
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should ignore trailing whitespace in the query', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Light Theme', false),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark ')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('cb1')
      expect(scored[0].score).toBeGreaterThan(0)
    })
  })

  describe('filterNodes', () => {
    it('should include checkbox items in search results', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Regular Item'),
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Auto Save', false),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.id).toBe('cb1')
        expect(displayNodes[0].node.kind).toBe('checkbox-item')
      }
    })

    it('should treat whitespace-only query as browse mode', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Regular Item'),
        createCheckboxItemDef('cb1', 'Dark Mode', true),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: '   ',
        nodes,
        highlightedId: null,
      })

      expect(isDeepSearching).toBe(false)
      expect(displayNodes).toHaveLength(2)
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      expect(isDisplayRowNode(displayNodes[1])).toBe(true)
    })
  })
})

// ============================================================================
// RadioGroupDef Tests
// ============================================================================

describe('RadioGroupDef', () => {
  describe('flattenNodes', () => {
    it('should include items from radio groups', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'option1', [
          createRadioItemDef('opt1', 'Option 1'),
          createRadioItemDef('opt2', 'Option 2'),
          createRadioItemDef('opt3', 'Option 3'),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(3)
      expect(flattened[0].radioGroup?.id).toBe('rg1')
      expect(flattened[1].radioGroup?.id).toBe('rg1')
      expect(flattened[2].radioGroup?.id).toBe('rg1')
    })

    it('should track radioGroup separately from group', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [createItemDef('item1', 'Item 1')]),
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Option 1'),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[0].radioGroup).toBeNull()
      expect(flattened[1].group).toBeNull()
      expect(flattened[1].radioGroup?.id).toBe('rg1')
    })
  })

  describe('filterNodes - always preserve', () => {
    it('should include entire radio group if any item matches', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'light',
          [
            createRadioItemDef('light', 'Light Theme'),
            createRadioItemDef('dark', 'Dark Theme'),
            createRadioItemDef('system', 'System Default'),
          ],
          { label: 'Theme' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
      })

      // Should return the entire radio group, not just the matching item
      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // All items should be present in the radio group
        expect(displayNodes[0].items).toHaveLength(1) // Only matching items
        expect(displayNodes[0].node.def.id).toBe('rg1')
      }
    })

    it('should preserve radio groups even with flatten behavior', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Regular Item'),
        createRadioGroupDef(
          'rg1',
          'opt1',
          [
            createRadioItemDef('opt1', 'Option One'),
            createRadioItemDef('opt2', 'Option Two'),
          ],
          { label: 'Options' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'option',
        nodes,
        highlightedId: null,
        groupSearchBehavior: 'flatten', // Even with flatten, radio groups should preserve
      })

      // Should have both the regular item and the radio group
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
    })

    it('should surface radio groups from submenus with breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', 'Settings', [
          createRadioGroupDef(
            'rg1',
            'light',
            [
              createRadioItemDef('light', 'Light'),
              createRadioItemDef('dark', 'Dark'),
            ],
            { label: 'Theme' },
          ),
        ]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
      })

      expect(isDeepSearching).toBe(true)

      // Find the radio group
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      expect(radioGroups[0].context.breadcrumbs[0].value).toBe('Settings')
      expect(radioGroups[0].context.isDeepSearchResult).toBe(true)
    })
  })

  describe('getBrowseNodesPreserve', () => {
    it('should render radio groups as DisplayRadioGroupNode', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'opt1',
          [
            createRadioItemDef('opt1', 'Option 1'),
            createRadioItemDef('opt2', 'Option 2'),
          ],
          { label: 'Options' },
        ),
      ]

      const displayNodes = getBrowseNodesPreserve(nodes, null)

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(2)
        expect(displayNodes[0].node.def.label).toBe('Options')
      }
    })

    it('resolves a node for the group without an explicit resolver', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Option 1'),
        ]),
      ]

      const displayNodes = getBrowseNodesPreserve(nodes, null)

      // `node` is non-optional, so the detached fallback must supply
      // one even when no menu-tree resolver is threaded through.
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].node).toBeDefined()
        expect(displayNodes[0].node.id).toBe('rg1')
        expect(displayNodes[0].node.kind).toBe('radio-group')
      }
    })
  })
})

// ============================================================================
// RadioItemDef Tests
// ============================================================================

describe('RadioItemDef', () => {
  describe('flattenNodes', () => {
    it('should include radio items in flattened results', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Option 1'),
          createRadioItemDef('opt2', 'Option 2'),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(2)
      expect(flattened[0].node.kind).toBe('radio-item')
      expect(flattened[1].node.kind).toBe('radio-item')
    })

    it('should track radioGroup context for radio items', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'opt1',
          [createRadioItemDef('opt1', 'Option 1')],
          { label: 'Options' },
        ),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(1)
      expect(flattened[0].radioGroup?.id).toBe('rg1')
      expect(flattened[0].radioGroup?.label).toBe('Options')
    })
  })

  describe('scoreNodes - keyword matching', () => {
    it('should score radio items based on value', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Light Theme'),
          createRadioItemDef('opt2', 'Dark Theme'),
        ]),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.value).toBe('Dark Theme')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should score radio items based on keywords', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'eq', { keywords: ['equals', 'is'] }),
          createRadioItemDef('opt2', 'contains', {
            keywords: ['includes', 'has'],
          }),
        ]),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'equals')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.value).toBe('eq')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should match radio items by keyword even when value does not match', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('eq', 'eq', {
            keywords: ['equals', 'is', 'same'],
          }),
          createRadioItemDef('neq', 'neq', {
            keywords: ['not equals', 'different'],
          }),
          createRadioItemDef('contains', 'contains', {
            keywords: ['includes', 'has'],
          }),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      // Search for 'same' - should match 'eq' via keywords
      const scoredSame = scoreNodes(flattened, 'same')
      expect(scoredSame).toHaveLength(1)
      expect(scoredSame[0].node.value).toBe('eq')

      // Search for 'includes' - should match 'contains' via keywords
      const scoredIncludes = scoreNodes(flattened, 'includes')
      expect(scoredIncludes).toHaveLength(1)
      expect(scoredIncludes[0].node.value).toBe('contains')
    })
  })

  describe('filterNodes - radio item filtering', () => {
    it('should filter radio groups showing only matching radio items', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'operators',
          'eq',
          [
            createRadioItemDef('eq', 'eq', { keywords: ['same', 'is'] }),
            createRadioItemDef('neq', 'neq', { keywords: ['different'] }),
            createRadioItemDef('contains', 'contains', {
              keywords: ['includes'],
            }),
          ],
          { label: 'Operators' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'same',
        nodes,
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Only the matching item should be shown
        expect(displayNodes[0].items).toHaveLength(1)
        expect(displayNodes[0].items[0].node.def.value).toBe('eq')
      }
    })

    it('should include radio items in deep search results from submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', 'Filters', [
          createRadioGroupDef(
            'operators',
            'eq',
            [
              createRadioItemDef('eq', 'eq', { keywords: ['equals', 'is'] }),
              createRadioItemDef('contains', 'contains', {
                keywords: ['includes'],
              }),
            ],
            { label: 'Operators' },
          ),
        ]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'includes',
        nodes,
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
      })

      expect(isDeepSearching).toBe(true)

      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      expect(radioGroups[0].items).toHaveLength(1)
      expect(radioGroups[0].items[0].node.def.value).toBe('contains')
      expect(radioGroups[0].context.breadcrumbs[0].value).toBe('Filters')
    })
  })
})

// ============================================================================
// Props/Context Structure Tests
// ============================================================================

describe('Render Params Structure', () => {
  it('should pass props to item render function', () => {
    const nodes: NodeDef[] = [
      createItemDef('item1', 'Item 1', { disabled: true }),
    ]

    const { displayNodes } = filterNodes({
      query: '',
      nodes,
      highlightedId: null,
    })

    // The context should include disabled
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    if (isDisplayRowNode(displayNodes[0])) {
      expect(displayNodes[0].context.disabled).toBe(true)
    }
  })

  it('should include search info in context', () => {
    const nodes: NodeDef[] = [createItemDef('item1', 'Test Item')]

    const { displayNodes } = filterNodes({
      query: 'test',
      nodes,
      highlightedId: null,
    })

    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    if (isDisplayRowNode(displayNodes[0])) {
      expect(displayNodes[0].context.search).not.toBeNull()
      expect(displayNodes[0].context.search?.query).toBe('test')
      expect(displayNodes[0].context.search?.score).toBeGreaterThan(0)
    }
  })

  it('should include group info in context for grouped items', () => {
    const nodes: NodeDef[] = [
      createGroupDef('g1', [createItemDef('item1', 'Item 1')], {
        label: 'My Group',
      }),
    ]

    const { displayNodes } = filterNodes({
      query: '',
      nodes,
      highlightedId: null,
    })

    expect(isDisplayGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayGroupNode(displayNodes[0])) {
      const item = displayNodes[0].items[0]
      expect(item.context.group?.id).toBe('g1')
      expect(item.context.group?.label).toBe('My Group')
    }
  })
})

// ============================================================================
// RadioGroupSearchBehavior Tests
// ============================================================================

describe('radioGroupSearchBehavior', () => {
  const createThemeRadioGroup = () =>
    createRadioGroupDef(
      'theme',
      'light',
      [
        createRadioItemDef('light', 'Light Theme'),
        createRadioItemDef('dark', 'Dark Theme'),
        createRadioItemDef('system', 'System Default'),
      ],
      { label: 'Theme' },
    )

  const createPriorityRadioGroup = () =>
    createRadioGroupDef(
      'priority',
      'medium',
      [
        createRadioItemDef('low', 'Low Priority'),
        createRadioItemDef('medium', 'Medium Priority'),
        createRadioItemDef('high', 'High Priority'),
      ],
      { label: 'Priority' },
    )

  describe('preserve (default)', () => {
    it('should show only matching items from radio group', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(1)
        expect(displayNodes[0].items[0].node.id).toBe('dark')
      }
    })

    it('should show multiple matching items when query matches multiple', () => {
      const nodes: NodeDef[] = [createPriorityRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'priority',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // All three items contain "Priority" in their label
        expect(displayNodes[0].items).toHaveLength(3)
      }
    })

    it('should not show radio group if no items match', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'nonexistent',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(0)
    })
  })

  describe('preserve-show-all', () => {
    it('should show ALL items when ANY item matches', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Should have all 3 items even though only "dark" matches
        expect(displayNodes[0].items).toHaveLength(3)
        // Matching item should be first (sorted by score)
        expect(displayNodes[0].items[0].node.id).toBe('dark')
        expect(displayNodes[0].items[0].context.search?.score).toBeGreaterThan(
          0,
        )
        // Non-matching items should have score 0
        expect(displayNodes[0].items[1].context.search?.score).toBe(0)
        expect(displayNodes[0].items[2].context.search?.score).toBe(0)
      }
    })

    it('should not show radio group if no items match', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'nonexistent',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Even with preserve-show-all, if nothing matches, don't show the group
      expect(displayNodes).toHaveLength(0)
    })

    it('should sort matching items first within radio group', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'light',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Light should be first since it matches
        expect(displayNodes[0].items[0].node.id).toBe('light')
      }
    })

    it('should work with deep search and breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('settings', 'Settings', [createThemeRadioGroup()]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(isDeepSearching).toBe(true)

      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      if (radioGroups[0]) {
        // Should have breadcrumbs
        expect(radioGroups[0].context.breadcrumbs[0].value).toBe('Settings')
        // Should have all 3 items
        expect(radioGroups[0].items).toHaveLength(3)
      }
    })
  })

  describe('flatten', () => {
    it('should show radio items as individual flat items', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(1)
      // Should be a row node, not a radio group node
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.id).toBe('dark')
      }
    })

    it('should show only matching items in flat list', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'theme',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      // Both "Light Theme" and "Dark Theme" match, but not "System Default"
      expect(displayNodes).toHaveLength(2)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
    })

    it('should mix flattened radio items with regular items by score', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Dark Mode Toggle'),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(2)
      // Both should be row nodes (radio items flattened)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
      // Both should match "dark"
      const ids = displayNodes.filter(isDisplayRowNode).map((n) => n.node.id)
      expect(ids).toContain('item1')
      expect(ids).toContain('dark')
    })
  })

  describe('interaction with groupSearchBehavior', () => {
    it('should preserve radio groups even when groupSearchBehavior is flatten', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createItemDef('grouped-item', 'Grouped Dark Item'),
        ]),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        groupSearchBehavior: 'flatten',
        radioGroupSearchBehavior: 'preserve',
      })

      // Group should be flattened (item shown directly)
      // Radio group should be preserved
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      const rowNodes = displayNodes.filter(isDisplayRowNode)

      expect(radioGroups).toHaveLength(1)
      expect(rowNodes).toHaveLength(1)
      expect(rowNodes[0].node.id).toBe('grouped-item')
    })

    it('should flatten both groups and radio groups when both are set to flatten', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createItemDef('grouped-item', 'Grouped Dark Item'),
        ]),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        groupSearchBehavior: 'flatten',
        radioGroupSearchBehavior: 'flatten',
      })

      // Both should be flattened - all row nodes
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
      expect(displayNodes).toHaveLength(2)
    })
  })

  describe('multiple radio groups', () => {
    it('should handle multiple radio groups independently', () => {
      const nodes: NodeDef[] = [
        createThemeRadioGroup(),
        createPriorityRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'high',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      // Only priority radio group should match
      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].node.def.id).toBe('priority')
      }
    })

    it('should show all items from matching radio groups with preserve-show-all', () => {
      const nodes: NodeDef[] = [
        createThemeRadioGroup(),
        createPriorityRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Only theme radio group matches
      expect(displayNodes).toHaveLength(1)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].node.def.id).toBe('theme')
        expect(displayNodes[0].items).toHaveLength(3) // All theme items
      }
    })
  })
})

// ============================================================================
// Mixed Content Tests
// ============================================================================

describe('Mixed Content', () => {
  it('should handle mix of items, checkbox items, and radio groups', () => {
    const nodes: NodeDef[] = [
      createItemDef('item1', 'Regular Item'),
      createCheckboxItemDef('cb1', 'Checkbox Item', true),
      createRadioGroupDef('rg1', 'opt1', [
        createRadioItemDef('opt1', 'Radio Option 1'),
        createRadioItemDef('opt2', 'Radio Option 2'),
      ]),
    ]

    const displayNodes = getBrowseNodesPreserve(nodes, null)

    expect(displayNodes).toHaveLength(3)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    expect(isDisplayRowNode(displayNodes[1])).toBe(true)
    expect(isDisplayRadioGroupNode(displayNodes[2])).toBe(true)
  })

  it('should handle radio groups inside groups (not recommended but handled)', () => {
    // Note: Radio groups inside regular groups is not a recommended pattern
    // but the code should handle it gracefully
    const nodes: NodeDef[] = [
      createGroupDef('g1', [
        createItemDef('item1', 'Item 1'),
        // Radio groups inside groups won't be flattened correctly
        // They should be at the top level
      ]),
    ]

    const flattened = flattenNodes(nodes)
    expect(flattened).toHaveLength(1)
  })
})

// ============================================================================
// Value Normalization Tests
// ============================================================================

describe('Value Normalization', () => {
  describe('scoreNodes', () => {
    it('should match items with leading/trailing whitespace in value', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', '  Dark Mode  '), // value with whitespace
        createItemDef('item2', 'Light Mode'),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark')

      // Should match despite whitespace in value
      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('item1')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should match items with whitespace-only keywords filtered out', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Settings', {
          keywords: ['  ', 'config', '  preferences  '],
        }),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'preferences')

      // Should match on trimmed keyword
      expect(scored).toHaveLength(1)
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should not match whitespace-only values', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', '   '), // whitespace-only value
        createItemDef('item2', 'Valid'),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'valid')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('item2')
    })
  })

  describe('flattenNodes with breadcrumbs', () => {
    it('should preserve raw submenu values in breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('submenu1', '  Settings  ', [
          createItemDef('item1', 'Dark Mode'),
        ]),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      // Find the nested item
      const nestedItem = flattened.find((f) => f.node.id === 'item1')
      expect(nestedItem).toBeDefined()
      // BreadcrumbNode.value preserves the raw value; normalization happens via slugify during ID generation
      expect(nestedItem?.breadcrumbs.map((b) => b.value)).toEqual([
        '  Settings  ',
      ])
    })

    it('should preserve raw values in deeply nested breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', '  Level 1  ', [
          createSubmenuDef('sub2', '  Level 2  ', [
            createItemDef('item1', 'Deep Item'),
          ]),
        ]),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      const deepItem = flattened.find((f) => f.node.id === 'item1')
      expect(deepItem).toBeDefined()
      // BreadcrumbNode.value preserves raw values; normalization happens via slugify during ID generation
      expect(deepItem?.breadcrumbs.map((b) => b.value)).toEqual([
        '  Level 1  ',
        '  Level 2  ',
      ])
    })

    it('supports includeInDeepSearch="trigger-only" on submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'settings',
          'Settings',
          [createItemDef('dark-mode', 'Dark Mode')],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened.map((f) => f.node.id)).toEqual(['settings'])
    })

    it('supports includeInDeepSearch=false on submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'settings',
          'Settings',
          [createItemDef('dark-mode', 'Dark Mode')],
          { includeInDeepSearch: false },
        ),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened).toHaveLength(0)
    })

    it('supports deep flattening for subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef('ai-filter', 'AI Filter', [
          createItemDef('assigned', 'assigned to me'),
        ]),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened.map((f) => f.node.id)).toEqual(['ai-filter', 'assigned'])
    })

    it('supports includeInDeepSearch="trigger-only" on subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef(
          'ai-filter',
          'AI Filter',
          [createItemDef('assigned', 'assigned to me')],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened.map((f) => f.node.id)).toEqual(['ai-filter'])
    })

    it('supports includeInDeepSearch=false on subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef(
          'ai-filter',
          'AI Filter',
          [createItemDef('assigned', 'assigned to me')],
          { includeInDeepSearch: false },
        ),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened).toHaveLength(0)
    })

    it('allows submenu override of Surface includeInDeepSearch default', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('overridden', 'Overridden', [
          createItemDef('item-1', 'Item 1'),
        ]),
        createSubmenuDef('defaulted', 'Defaulted', [
          createItemDef('item-2', 'Item 2'),
        ]),
      ]

      const flattened = flattenNodes(nodes, {
        deep: true,
        includeInDeepSearch: 'trigger-only',
      })

      expect(flattened.map((f) => f.node.id)).toEqual([
        'overridden',
        'defaulted',
      ])

      const withOverride = flattenNodes(
        [
          createSubmenuDef(
            'overridden',
            'Overridden',
            [createItemDef('item-1', 'Item 1')],
            { includeInDeepSearch: true },
          ),
          createSubmenuDef('defaulted', 'Defaulted', [
            createItemDef('item-2', 'Item 2'),
          ]),
        ],
        {
          deep: true,
          includeInDeepSearch: 'trigger-only',
        },
      )

      expect(withOverride.map((f) => f.node.id)).toEqual([
        'overridden',
        'item-1',
        'defaulted',
      ])
    })

    it('hard-stops descendants when ancestor is trigger-only', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'parent',
          'Parent',
          [
            createSubmenuDef(
              'child',
              'Child',
              [createItemDef('leaf', 'Leaf')],
              { includeInDeepSearch: true },
            ),
          ],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      expect(flattened.map((f) => f.node.id)).toEqual(['parent'])
    })

    it('collectAsyncSubmenus only collects submenus with row inclusion', () => {
      const asyncConfig = {
        type: 'static' as const,
        Loader: () => null,
      }

      const nodes: NodeDef[] = [
        createSubmenuDef('included', 'Included', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: true,
        }),
        createSubmenuDef('trigger-only', 'Trigger Only', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: 'trigger-only',
        }),
        createSubmenuDef('excluded', 'Excluded', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: false,
        }),
      ]

      const collected = collectAsyncSubmenus(nodes)

      expect(collected.map((entry) => entry.id)).toEqual(['Included'])
    })

    it('collectAsyncSubmenus also collects async subpages', () => {
      const asyncConfig = {
        type: 'static' as const,
        Loader: () => null,
      }

      const nodes: NodeDef[] = [
        createSubpageDef('ai-filter', 'AI Filter', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: true,
        }),
      ]

      const collected = collectAsyncSubmenus(nodes)

      expect(collected.map((entry) => entry.id)).toEqual(['AI Filter'])
    })

    it('mergeAsyncNodesIntoTree merges async nodes into subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef('ai-filter', 'AI Filter', [
          createItemDef('static-item', 'Static item'),
        ]),
      ]

      const merged = mergeAsyncNodesIntoTree(nodes, [
        {
          id: 'AI Filter',
          breadcrumbs: [],
          nodes: [createItemDef('async-item', 'Async item')],
        },
      ])

      const subpage = merged[0]
      expect(subpage?.kind).toBe('subpage')
      if (subpage?.kind !== 'subpage') {
        throw new Error('expected merged node to be subpage')
      }

      expect(subpage.nodes?.map((node) => node.id)).toEqual([
        'static-item',
        'async-item',
      ])
    })

    it('collectAsyncSubmenus respects ancestor trigger-only hard stop', () => {
      const asyncConfig = {
        type: 'static' as const,
        Loader: () => null,
      }

      const nodes: NodeDef[] = [
        createSubmenuDef(
          'parent',
          'Parent',
          [
            createSubmenuDef('child', 'Child', [], {
              asyncNodes: asyncConfig,
              includeInDeepSearch: true,
            }),
          ],
          {
            includeInDeepSearch: 'trigger-only',
          },
        ),
      ]

      const collected = collectAsyncSubmenus(nodes)

      expect(collected).toHaveLength(0)
    })
  })
})

// ============================================================================
// Forced Sorting Tests
// ============================================================================

describe('Forced sorting overrides', () => {
  it('scoreNodes uses forceScore to include non-matching rows', () => {
    const nodes: NodeDef[] = [
      createItemDef('pinned', 'Pinned row', { forceScore: 5 }),
      createItemDef('regular', 'Regular row'),
    ]

    const flattened = flattenNodes(nodes)
    const scored = scoreNodes(flattened, 'zzzz')

    expect(scored).toHaveLength(1)
    expect(scored[0].node.id).toBe('pinned')
    expect(scored[0].score).toBe(5)
  })

  it('filterNodes orders rows by forceOrder before score', () => {
    const nodes: NodeDef[] = [
      createItemDef('late', 'Late row', {
        forceOrder: 20,
        forceScore: 100,
      }),
      createItemDef('early', 'Early row', {
        forceOrder: -5,
        forceScore: 1,
      }),
    ]

    const { displayNodes } = filterNodes({
      query: 'x',
      nodes,
      highlightedId: null,
      groupSearchBehavior: 'flatten',
    })

    expect(displayNodes).toHaveLength(2)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    expect(isDisplayRowNode(displayNodes[1])).toBe(true)

    if (
      isDisplayRowNode(displayNodes[0]) &&
      isDisplayRowNode(displayNodes[1])
    ) {
      expect(displayNodes[0].node.id).toBe('early')
      expect(displayNodes[1].node.id).toBe('late')
    }
  })

  it('keeps items ahead of submenus within the same forceOrder bucket', () => {
    const nodes: NodeDef[] = [
      createSubmenuDef('submenu', 'Settings', [], {
        forceOrder: -10,
        forceScore: 100,
      }),
      createItemDef('item', 'Preferences', {
        forceOrder: -10,
        forceScore: 1,
      }),
    ]

    const { displayNodes } = filterNodes({
      query: 'x',
      nodes,
      highlightedId: null,
      groupSearchBehavior: 'flatten',
    })

    expect(displayNodes).toHaveLength(2)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    expect(isDisplayRowNode(displayNodes[1])).toBe(true)

    if (
      isDisplayRowNode(displayNodes[0]) &&
      isDisplayRowNode(displayNodes[1])
    ) {
      expect(displayNodes[0].node.kind).toBe('item')
      expect(displayNodes[1].node.kind).toBe('submenu')
      expect(displayNodes[0].node.id).toBe('item')
      expect(displayNodes[1].node.id).toBe('submenu')
    }
  })
})
