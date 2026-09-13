import { getSubpagePageId } from '../utils.js'

function subpage(
  value: string,
  options: Pick<SubpageDef, 'id' | 'pageId'> = {},
): SubpageDef {
  return {
    kind: 'subpage',
    value,
    nodes: [],
    renderTrigger: () => null,
    renderContent: () => null,
    ...options,
  }
}

function breadcrumb(value: string, id?: string) {
  return {
    node: subpage(value, id === undefined ? {} : { id }),
    value,
    ...(id === undefined ? {} : { id }),
  }
}

describe('getSubpagePageId', () => {
  it('uses an explicit pageId verbatim', () => {
    expect(
      getSubpagePageId(subpage('Settings', { pageId: 'custom.Page' }), []),
    ).toBe('custom.Page')
  })

  it('slugifies an id-less subpage value', () => {
    expect(getSubpagePageId(subpage('Account Settings'), [])).toBe(
      'subpage.account-settings',
    )
  })

  it('passes an explicit slug-shaped id through verbatim', () => {
    expect(
      getSubpagePageId(
        subpage('Account Settings', { id: 'account-settings' }),
        [],
      ),
    ).toBe('subpage.account-settings')
  })

  it('passes an explicit non-slug id through verbatim', () => {
    expect(
      getSubpagePageId(subpage('Account Settings', { id: 'My.Page' }), []),
    ).toBe('subpage.My.Page')
  })

  it('uses breadcrumb ids verbatim and slugifies id-less breadcrumb values', () => {
    expect(
      getSubpagePageId(subpage('Current Page'), [
        breadcrumb('Parent Value'),
        breadcrumb('Another Value', 'Parent.Page'),
      ]),
    ).toBe('subpage.parent-value.Parent.Page.current-page')
  })

  it('drops empty breadcrumb and leaf Definition Keys', () => {
    expect(
      getSubpagePageId(subpage('', { id: '' }), [
        breadcrumb('', ''),
        breadcrumb('Visible Value'),
      ]),
    ).toBe('subpage.visible-value')
  })

  it('drops an empty explicit id even when the value is non-empty (canonical empty Definition Key rule)', () => {
    // Per the canonical Definition Key rule, an explicit id is used verbatim — an
    // empty-string id therefore resolves to an empty Definition Key, which is
    // dropped from the path (matching resolver definitionPath semantics). Consumers
    // must omit `id` (not pass '') to fall back to the slugified value.
    expect(getSubpagePageId(subpage('Settings', { id: '' }), [])).toBe(
      'subpage',
    )
    expect(
      getSubpagePageId(subpage('Settings', { id: '' }), [breadcrumb('Parent')]),
    ).toBe('subpage.parent')
  })
})
