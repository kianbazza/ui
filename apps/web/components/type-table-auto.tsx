'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import Markdown from 'react-markdown'
// Import the generated types metadata
import typesMeta from '@/.types/types-meta.json'
import { cn } from '@/lib/cn'

import type { MetaOutput, PropMeta } from '@/scripts/build-types-meta'
import { HighlightedType } from './highlighted-type'

const typesData = typesMeta as MetaOutput

interface ExpandablePropRowProps {
  prop: PropMeta
  depth?: number
}

/**
 * Remove " | undefined" suffix from type string if property is optional
 */
function cleanTypeString(typeStr: string, required: boolean): string {
  if (!required && typeStr.endsWith(' | undefined')) {
    return typeStr.slice(0, -' | undefined'.length)
  }
  return typeStr
}

/**
 * Get simplified prop type for display in the table row.
 * Returns { type: string, hasDetailedType: boolean }
 *
 * Based on Base UI's getShortPropType approach:
 * - Special handling for className, style, render props
 * - Event handlers show as "function"
 * - Simple types shown as-is
 * - Complex types are simplified
 */
function getShortPropType(
  name: string,
  type: string | undefined,
  _formattedType?: string,
  shortType?: string,
): { type: string; hasDetailedType: boolean } {
  // If we have a pre-computed short type (e.g., "Align"), use it
  if (shortType) {
    return { type: shortType, hasDetailedType: true }
  }
  // Event handlers (on*, get*) -> function
  if (/^(on|get)[A-Z].*/.test(name)) {
    return { type: 'function', hasDetailedType: true }
  }

  if (type === undefined || type === null) {
    return { type: String(type), hasDetailedType: false }
  }

  // className -> string | function
  if (name === 'className') {
    return { type: 'string | function', hasDetailedType: true }
  }

  // style -> React.CSSProperties | function
  if (name === 'style') {
    return { type: 'React.CSSProperties | function', hasDetailedType: true }
  }

  // render -> ReactElement | function
  if (name === 'render') {
    return { type: 'ReactElement | function', hasDetailedType: true }
  }

  // children - often complex but keep as-is
  if (name === 'children') {
    // Simplify React.ReactNode to ReactNode
    if (type === 'React.ReactNode' || type === 'ReactNode') {
      return { type: 'ReactNode', hasDetailedType: false }
    }
    // If it's a function type for children
    if (type.includes('=>')) {
      return { type: 'function', hasDetailedType: true }
    }
    return { type, hasDetailedType: false }
  }

  // Simple primitive types - show as-is
  if (
    type === 'boolean' ||
    type === 'string' ||
    type === 'number' ||
    type === 'string[]' ||
    type === 'number[]' ||
    type === 'boolean[]'
  ) {
    return { type, hasDetailedType: false }
  }

  // ReactElement types - simplify to ReactElement
  if (/^React\.?ReactElement(<.*>)?$/.test(type) || type === 'ReactElement') {
    return { type: 'ReactElement', hasDetailedType: false }
  }

  // ReactNode types - simplify
  if (type === 'React.ReactNode' || type === 'ReactNode') {
    return { type: 'ReactNode', hasDetailedType: false }
  }

  // Function types
  if (type.includes('=>') || type.match(/^\([^)]*\)\s*:/)) {
    return { type: 'function', hasDetailedType: true }
  }

  // Refs
  if (name.endsWith('Ref') || type.includes('Ref<')) {
    // Extract the inner type if simple
    const refMatch = type.match(/^(?:React\.)?Ref<([^>]+)>$/)
    if (refMatch) {
      return { type: `Ref<${refMatch[1]}>`, hasDetailedType: false }
    }
    return { type: 'Ref', hasDetailedType: true }
  }

  // Check if it's a named type alias (PascalCase identifier, not a primitive)
  // These are types like PopupMenuPositionerAlign, SelectPositionerSide, etc.
  const namedTypeMatch = type.match(/^([A-Z][A-Za-z0-9_$]*)$/)
  if (namedTypeMatch) {
    const typeName = namedTypeMatch[1]!
    // Show short type names (like "Align", "Side") as-is
    // Longer names (like "PopupMenuPositionerAlign") show "Union"
    if (typeName.length <= 15) {
      return { type: typeName, hasDetailedType: true }
    }
    return { type: 'Union', hasDetailedType: true }
  }

  // Simple unions (few members, short length) - show as-is
  const pipeCount = (type.match(/\|/g) || []).length
  if (pipeCount === 0) {
    // No union, but check length
    if (type.length <= 40) {
      return { type, hasDetailedType: false }
    }
    // Long type - extract base name
    const baseMatch = type.match(/^([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (baseMatch) {
      return { type: baseMatch[1]!, hasDetailedType: true }
    }
    return { type: 'object', hasDetailedType: true }
  }

  // Union with 2 members and reasonably short
  if (pipeCount === 1 && type.length <= 35) {
    return { type, hasDetailedType: false }
  }

  // Union with few members but longer - try to simplify
  if (pipeCount < 3 && type.length <= 50) {
    return { type, hasDetailedType: false }
  }

  // Complex union - simplify
  // Check if it's a string literal union like "'left' | 'right' | 'center'"
  if (/^'[^']*'(\s*\|\s*'[^']*')+$/.test(type)) {
    const literals = type.match(/'[^']*'/g) || []
    if (literals.length <= 4 && type.length <= 40) {
      return { type, hasDetailedType: false }
    }
    return { type: `'...' (${literals.length} options)`, hasDetailedType: true }
  }

  return { type: 'Union', hasDetailedType: true }
}

export function ExpandablePropRow({ prop, depth = 0 }: ExpandablePropRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasNestedProps = prop.expandedType && prop.expandedType.length > 0
  const indent = depth * 16 // 16px per depth level
  const cleanedType = cleanTypeString(prop.type, prop.required)
  const { type: simplifiedType, hasDetailedType } = getShortPropType(
    prop.name,
    cleanedType,
    prop.formattedType,
    prop.shortType,
  )
  const hasDetails = prop.description || hasDetailedType || hasNestedProps

  return (
    <>
      {/* Collapsed Row */}
      {/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
      <div
        className={cn(
          'grid grid-cols-subgrid col-span-3 group hover:bg-muted/50 border-b border-border items-center',
          hasDetails && 'cursor-pointer',
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="px-4 py-2">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${indent}px` }}
          >
            <div
              className={cn(
                'p-0.5 rounded transition-colors',
                !hasDetails && 'invisible',
              )}
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
            <code className="rounded-sm bg-blue-300/25 dark:text-primary text-blue-700 dark:bg-blue-600/50 px-[0.35rem] py-[0.2rem] text-[13px] font-mono">
              {prop.name}
              {!prop.required && '?'}
            </code>
          </div>
        </div>
        <div className="px-4 py-2">
          <HighlightedType code={simplifiedType} />
        </div>
        <div className="px-4 py-2">
          {prop.default ? (
            <HighlightedType code={prop.default} />
          ) : (
            <span className="text-muted-foreground/50 text-xs select-none">
              —
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details Row */}
      {isExpanded && (
        <div className="grid grid-cols-subgrid col-span-3 bg-muted border-b border-border pl-7">
          {/* Second column spans remaining columns */}
          <div className="px-4 py-3 col-span-3 space-y-3 [&>div]:[&>div]:even:ml-2 grid grid-cols-subgrid">
            {/* Property Name */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="font-semibold text-muted-foreground flex-shrink-0">
                Property
              </div>
              <div className="col-span-2 ">
                <code className="bg-inherit py-1 font-mono break-words min-w-0">
                  <HighlightedType code={prop.name} />
                  {/*{prop.name}*/}
                </code>
              </div>
            </div>

            {/* Required */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                Required
              </div>
              <div className="col-span-2">
                {prop.required ? (
                  <span className="text-sm px-2 py-0.5 rounded-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    Yes
                  </span>
                ) : (
                  <span className="text-sm px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Optional
                  </span>
                )}
              </div>
            </div>

            {/* Default */}
            {prop.default && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Default
                </div>
                <div className="col-span-2">
                  <code className="bg-inherit py-1 font-mono text-sm break-words min-w-0">
                    <HighlightedType code={prop.default} />
                  </code>
                </div>
              </div>
            )}

            {/* Description */}
            {prop.description && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Description
                </div>
                <div className="col-span-2 text-muted-foreground break-words min-w-0">
                  <Markdown
                    components={{
                      code: ({ children }) => (
                        // 'relative rounded-sm bg-muted px-1 py-0.5 font-mono text-sm border inset-shadow-xs font-[450]',

                        <code className="rounded-sm bg-muted px-1 py-0.5 border inset-shadow-xs font-[450] font-mono text-sm break-words min-w-0">
                          {children}
                        </code>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last-of-type:mb-0">{children}</p>
                      ),
                      ul: ({
                        className,
                        ...props
                      }: React.HTMLAttributes<HTMLUListElement>) => (
                        <ul
                          className={cn(
                            'my-6 ml-6 list-disc [&>li>ul]:my-2 [&>li>ul]:ml-4',
                            className,
                          )}
                          {...props}
                        />
                      ),
                      li: ({
                        className,
                        ...props
                      }: React.HTMLAttributes<HTMLLIElement>) => (
                        <li className={cn('mt-1', className)} {...props} />
                      ),
                    }}
                  >
                    {prop.description}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Type */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                Type
              </div>
              <div className="col-span-2 rounded-sm bg-inherit py-1 text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                <HighlightedType
                  code={cleanedType}
                  formattedCode={prop.formattedType}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Reference Link */}
            {prop.referencePath && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Reference
                </div>
                <Link
                  href={`#${prop.referencePath}`}
                  className="col-span-2 text-blue-600 dark:text-blue-400 hover:underline text-sm break-words"
                >
                  View {prop.referencePath} →
                </Link>
              </div>
            )}

            {/* Nested Properties */}
            {hasNestedProps &&
              prop.expandedType &&
              prop.expandedType.length > 0 && (
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                  <div className="font-semibold text-muted-foreground flex-shrink-0">
                    Properties
                  </div>
                  <div className="space-y-2 min-w-0">
                    {prop.expandedType.map((expandedProp) => (
                      <div
                        key={expandedProp.name}
                        className="text-xs break-words font-mono"
                      >
                        <code className="text-blue-600 dark:text-blue-400 font-mono">
                          {expandedProp.name}
                          {!expandedProp.required && '?'}
                        </code>
                        <span className="text-muted-foreground mx-2">:</span>
                        <HighlightedType
                          code={cleanTypeString(
                            expandedProp.type,
                            expandedProp.required,
                          )}
                          formattedCode={expandedProp.formattedType}
                          className="inline"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  )
}

interface TypeTableAutoProps {
  /**
   * Type name to display (e.g., "MenuDef")
   */
  type: string
  /**
   * Package name (e.g., "@bazza-ui/menu")
   * If not provided, will search all packages
   */
  pkg?: string
}

/**
 * Automatically renders a property table for a type from the generated metadata
 */
/**
 * Helper to find a type in the metadata
 */
function findTypeMeta(type: string, pkg?: string) {
  if (pkg) {
    return typesData[pkg]?.types?.[type]
  }
  // Search all packages
  for (const pkgData of Object.values(typesData)) {
    if (pkgData.types[type]) {
      return pkgData.types[type]
    }
  }
  return undefined
}

export function TypeTableAuto({ type, pkg }: TypeTableAutoProps) {
  const typeMeta = findTypeMeta(type, pkg)

  if (!typeMeta?.props || typeMeta.props.length === 0) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          Type <code className="font-mono font-semibold">{type}</code> not found
          or has no properties
          {pkg ? ` in package ${pkg}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 border border-border rounded-md overflow-hidden">
      <div className="w-full grid grid-cols-[35%_35%_30%]">
        {/* Header */}
        <div className="grid grid-cols-subgrid col-span-3 bg-neutral-100 dark:bg-neutral-900 border-b border-border text-sm">
          <div className="px-4 py-3 font-medium">Property</div>
          <div className="px-4 py-3 font-medium">Type</div>
          <div className="px-4 py-3 font-medium">Default</div>
        </div>

        {/* Body */}
        <div className="text-[13px] grid grid-cols-subgrid col-span-3 bg-white dark:bg-black">
          {typeMeta.props.map((prop: any) => (
            <ExpandablePropRow key={prop.name} prop={prop} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface StateTableAutoProps {
  /**
   * State type name to display (e.g., "SelectTriggerState")
   */
  type: string
  /**
   * Package name (e.g., "@bazza-ui/react")
   * If not provided, will search all packages
   */
  pkg?: string
}

/**
 * Renders a simple table for State types showing Property, Type, and Description.
 * State types define what's available in render/className/style function callbacks.
 */
export function StateTableAuto({ type, pkg }: StateTableAutoProps) {
  const typeMeta = findTypeMeta(type, pkg)

  if (!typeMeta?.props || typeMeta.props.length === 0) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          State type <code className="font-mono font-semibold">{type}</code> not
          found or has no properties
          {pkg ? ` in package ${pkg}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 border border-border rounded-md overflow-hidden">
      <div className="w-full text-sm grid grid-cols-[30%_20%_50%]">
        {/* Header */}
        <div className="grid grid-cols-subgrid col-span-3 bg-neutral-100 dark:bg-neutral-900 border-b border-border">
          <div className="px-4 py-3 font-mono font-semibold">State</div>
          <div className="px-4 py-3 font-mono font-semibold">Type</div>
          <div className="px-4 py-3 font-mono font-semibold">Description</div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-subgrid col-span-3 bg-white dark:bg-black">
          {typeMeta.props.map((prop: any) => (
            <div
              key={prop.name}
              className="grid grid-cols-subgrid col-span-3 border-b border-border last:border-b-0"
            >
              <div className="px-4 py-2">
                <code className="rounded-sm bg-blue-300/25 dark:text-primary text-blue-700 dark:bg-blue-600/50 px-[0.35rem] py-[0.2rem] text-sm font-mono">
                  {prop.name}
                </code>
              </div>
              <div className="px-4 py-2">
                <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem] text-sm font-mono">
                  {prop.type}
                </code>
              </div>
              <div className="px-4 py-2 text-muted-foreground text-sm">
                {prop.description || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
