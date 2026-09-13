import { describe, expect, it, vi } from 'vitest'
import type {
  DisplayNode,
  DisplayRowNode,
  ItemDef,
  TreeItemDef,
} from '../types.js'
import {
  computeDefPath,
  filterNodes,
  getBrowseNodesFlatten,
  getBrowseNodesPreserve,
} from '../utils.js'

describe('computeDefPath', () => {
  it('keeps only submenu/subpage breadcrumbs and retains an empty leaf key', () => {
    expect(
      computeDefPath(
        ['root'],
        [
          {
            node: tree('Inline', []) as TreeItemDef,
            value: 'Inline',
          },
          {
            node: {
              kind: 'submenu',
              value: 'Submenu',
              nodes: [],
              render: () => null,
            },
            value: 'Submenu',
          },
        ],
        '',
        'Leaf',
      ),
    ).toEqual(['root', 'submenu', ''])
  })
})

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: () => null,
})

const tree = (
  value: string,
  nodes: TreeItemDef['nodes'] = [],
  options: Partial<TreeItemDef> = {},
): TreeItemDef => ({
  kind: 'tree-item',
  id: value.toLowerCase().replaceAll(' ', '-'),
  value,
  nodes,
  render: () => null,
  ...options,
})

const nodes = [
  {
    kind: 'group' as const,
    id: 'teams',
    label: 'Your teams',
    nodes: [
      tree('Product & Engineering', [
        item('Core builder team'),
        item('Design team'),
      ]),
      tree('Archive', [item('Old team')], { selectable: false }),
      tree('Platform', [item('Design team')]),
    ],
  },
]

function rows(displayNodes: DisplayNode[]): DisplayRowNode[] {
  return displayNodes.flatMap((node) =>
    node.kind === 'group' || node.kind === 'radio-group'
      ? node.items
      : node.kind === 'row'
        ? [node]
        : [],
  )
}

function search(query: string) {
  return rows(
    filterNodes({
      query,
      nodes,
      highlightedId: null,
    }).displayNodes,
  )
}

describe('tree nodes', () => {
  it('expands browse rows depth-first with tree context and group membership', () => {
    const result = filterNodes({ query: '', nodes, highlightedId: null })
    const browseRows = rows(result.displayNodes)

    expect(browseRows.map((row) => row.node.def.value)).toEqual([
      'Product & Engineering',
      'Core builder team',
      'Design team',
      'Archive',
      'Old team',
      'Platform',
      'Design team',
    ])
    expect(browseRows.every((row) => row.context.group?.id === 'teams')).toBe(
      true,
    )
    expect(browseRows[1].context.tree).toMatchObject({
      depth: 1,
      isLastChild: false,
      ancestorsLast: [false],
    })
    expect(browseRows[2].context.tree).toMatchObject({
      depth: 1,
      isLastChild: true,
      ancestorsLast: [false],
    })
    expect(browseRows[3].context.tree).toMatchObject({
      header: true,
      depth: 0,
    })
    expect(browseRows[1].context.breadcrumbs.map((b) => b.value)).toEqual([
      'Product & Engineering',
    ])
  })

  it('qualifies browse IDs for distinct tree branches', () => {
    const browseRows = rows(
      filterNodes({ query: '', nodes, highlightedId: null }).displayNodes,
    ).filter((row) => row.node.def.value === 'Design team')
    const getId = (row: DisplayRowNode) =>
      [
        ...row.context.breadcrumbs.map((breadcrumb) => breadcrumb.value),
        row.node.def.value,
      ].join('.')

    expect(getId(browseRows[0])).not.toBe(getId(browseRows[1]))
  })

  it('surfaces duplicate descendant values with breadcrumb paths', () => {
    const designRows = search('design').filter(
      (row) => row.node.def.value === 'Design team',
    )
    expect(designRows).toHaveLength(2)
    expect(designRows.map((row) => row.context.breadcrumbs[0].value)).toEqual([
      'Product & Engineering',
      'Platform',
    ])
    expect(designRows.every((row) => row.context.tree === null)).toBe(true)
  })

  it('cascades ancestor matches to selectable descendants', () => {
    expect(search('product').map((row) => row.node.def.value)).toEqual([
      'Product & Engineering',
      'Core builder team',
      'Design team',
    ])
  })

  it('hides header rows while retaining their breadcrumb contribution', () => {
    expect(search('old').map((row) => row.node.def.value)).toContain('Old team')
    expect(
      search('old').find((row) => row.node.def.value === 'Old team')?.context
        .breadcrumbs[0].value,
    ).toBe('Archive')
    expect(search('archive').map((row) => row.node.def.value)).toContain(
      'Old team',
    )
    expect(
      search('archive').some((row) => row.node.def.value === 'Archive'),
    ).toBe(false)
  })

  it('does not search descendants when deepSearch is false', () => {
    const shallowNodes = [
      {
        ...nodes[0],
        nodes: [
          tree('Product & Engineering', [item('Core builder team')], {
            deepSearch: false,
          }),
        ],
      },
    ]
    expect(
      rows(
        filterNodes({ query: 'core', nodes: shallowNodes, highlightedId: null })
          .displayNodes,
      ),
    ).toHaveLength(0)
  })

  it('skips unsupported tree children and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const withSeparator = [
      tree('Root', [{ kind: 'separator' as const, id: 'separator' }]),
    ]
    expect(
      filterNodes({ query: '', nodes: withSeparator, highlightedId: null })
        .displayNodes,
    ).toHaveLength(1)
    expect(
      filterNodes({ query: 'root', nodes: withSeparator, highlightedId: null })
        .displayNodes,
    ).toHaveLength(1)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('tracks lastness for id-less tree roots inside a group', () => {
    const groupedNodes = [
      {
        kind: 'group' as const,
        id: 'teams',
        label: 'Your teams',
        nodes: [
          tree('First root', [item('First child')], { id: undefined }),
          tree('Second root', [item('Second child')], { id: undefined }),
        ],
      },
    ]
    const browseRows = rows(
      filterNodes({ query: '', nodes: groupedNodes, highlightedId: null })
        .displayNodes,
    )

    expect(browseRows[0].context.tree?.isLastChild).toBe(false)
    expect(browseRows[1].context.tree?.ancestorsLast).toEqual([false])
    expect(browseRows[2].context.tree?.isLastChild).toBe(true)
  })

  it('tracks lastness for id-less ungrouped tree roots', () => {
    const ungroupedNodes = [
      tree('First root', [item('First child')], { id: undefined }),
      tree('Second root', [item('Second child')], { id: undefined }),
    ]
    const browseRows = getBrowseNodesPreserve(
      ungroupedNodes,
      null,
    ) as DisplayRowNode[]

    expect(browseRows[0].context.tree?.isLastChild).toBe(false)
    expect(browseRows[1].context.tree?.ancestorsLast).toEqual([false])
    expect(browseRows[2].context.tree?.isLastChild).toBe(true)
  })

  it('tracks lastness for id-less tree roots in flatten mode', () => {
    const ungroupedNodes = [
      tree('First root', [item('First child')], { id: undefined }),
      tree('Second root', [item('Second child')], { id: undefined }),
    ]
    const browseRows = getBrowseNodesFlatten(
      ungroupedNodes,
      null,
    ) as DisplayRowNode[]

    expect(browseRows[0].context.tree?.isLastChild).toBe(false)
    expect(browseRows[1].context.tree?.ancestorsLast.at(-1)).toBe(false)
    expect(browseRows[2].context.tree?.isLastChild).toBe(true)
  })

  it('does not render hidden tree children or count them as children', () => {
    const browseRows = getBrowseNodesPreserve(
      [
        tree('Visible parent', [
          { ...item('Hidden child'), hidden: true },
          item('Visible child'),
        ]),
        tree('Hidden-only parent', [
          { ...item('Hidden-only child'), hidden: true },
        ]),
        tree('Visible-first parent', [
          item('Visible-first child'),
          { ...item('Hidden-after child'), hidden: true },
        ]),
      ],
      null,
    ) as DisplayRowNode[]

    expect(browseRows.map((row) => row.node.def.value)).toEqual([
      'Visible parent',
      'Visible child',
      'Hidden-only parent',
      'Visible-first parent',
      'Visible-first child',
    ])
    expect(browseRows[0].context.tree?.hasChildren).toBe(true)
    expect(browseRows[1].context.tree?.isLastChild).toBe(true)
    expect(browseRows[2].context.tree?.hasChildren).toBe(false)
    expect(browseRows[4].context.tree?.isLastChild).toBe(true)
  })
})
