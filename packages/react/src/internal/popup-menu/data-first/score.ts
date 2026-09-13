// ============================================================================
// Score Nodes
// ============================================================================

import { commandScore } from '../../listbox/utils/command-score.js'
import { normalizeValue } from '../../listbox/utils/normalize.js'
import type { FlattenedNode, ScoredNode } from './types.js'

// Score Nodes
// ============================================================================

/**
 * Scores nodes against a search query.
 * Returns only nodes with a score > 0.
 */
export function scoreNodes(
  flattenedNodes: FlattenedNode[],
  query: string,
  normalizeQuery: (query: string) => string = normalizeValue,
): ScoredNode[] {
  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    // No query - return all nodes with score 1
    return flattenedNodes.map(
      ({ node, breadcrumbs, group, radioGroup }): ScoredNode => ({
        node,
        score: 1,
        breadcrumbs,
        group,
        radioGroup,
      }),
    )
  }

  const results: ScoredNode[] = []

  for (const {
    node,
    breadcrumbs,
    group,
    radioGroup,
    inheritedKeywords,
  } of flattenedNodes) {
    // Normalize value and keywords to match cmdk's behavior
    const normalizedValue = normalizeValue(node.def.value)
    const normalizedKeywords = [
      ...(node.def.keywords ?? []),
      ...inheritedKeywords,
    ]
      .map((k) => normalizeValue(k))
      .filter(Boolean)

    const fuzzyScore = commandScore(
      normalizedValue,
      normalizedQuery,
      normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
    )
    const score = node.def.forceScore ?? fuzzyScore

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
        group,
        radioGroup,
      })
    }
  }

  return results
}

// ============================================================================
