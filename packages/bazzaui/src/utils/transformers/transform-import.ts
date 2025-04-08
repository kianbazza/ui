// @ts-nocheck

import type { RegistryItem } from '@/src/registry/schema.js'
import type { Config } from '@/src/utils/get-config.js'
import type { Transformer } from '@/src/utils/transformers/index.js'

export const transformImport: Transformer = async ({
  sourceFile,
  files,
  config,
  isRemote,
}) => {
  const workspaceAlias = config.aliases?.utils?.split('/')[0]?.slice(1)
  const utilsImport = `@${workspaceAlias}/lib/utils`

  const importDeclarations = sourceFile.getImportDeclarations()

  // console.log('config', config)

  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = updateImportAliases(
      importDeclaration.getModuleSpecifierValue(),
      config,
      isRemote,
      files,
    )
    console.log(
      'moduleSpecifier changed from:',
      '\n',
      'old:',
      importDeclaration.getModuleSpecifierValue(),
      '\n',
      'new:',
      moduleSpecifier,
    )

    importDeclaration.setModuleSpecifier(moduleSpecifier)

    // Replace `import { cn } from "@/lib/utils"`
    if (utilsImport === moduleSpecifier || moduleSpecifier === '@/lib/utils') {
      const namedImports = importDeclaration.getNamedImports()
      const cnImport = namedImports.find((i) => i.getName() === 'cn')
      if (cnImport) {
        importDeclaration.setModuleSpecifier(
          utilsImport === moduleSpecifier
            ? moduleSpecifier.replace(utilsImport, config.aliases.utils)
            : config.aliases.utils,
        )
      }
    }
  }

  return sourceFile
}

function updateImportAliases(
  moduleSpecifier: string,
  config: Config,
  isRemote: boolean,
  files: RegistryItem['files'],
) {
  // Not a local import.
  if (!moduleSpecifier.startsWith('@/') && !isRemote) {
    return moduleSpecifier
  }

  // This treats the remote as coming from a faux registry.
  if (isRemote && moduleSpecifier.startsWith('@/')) {
    // biome-ignore lint/style/noParameterAssign:
    moduleSpecifier = moduleSpecifier.replace(/^@\//, '@/registry/new-york/')
  }

  // Check if registry file has a mapped target with subdirectory
  const registryItem = config.registry?.find((item) =>
    moduleSpecifier.includes(item.path),
  )

  if (registryItem?.target) {
    const aliasBase = getAliasBase(registryItem.target, config)
    registryItem.target.replace(/^components\//, `${aliasBase}/`)
  }

  // Not a registry import.
  if (!moduleSpecifier.startsWith('@/registry/')) {
    const alias = config.aliases.components.split('/')[0]
    return moduleSpecifier.replace(/^@\//, `${alias}/`)
  }

  if (moduleSpecifier.match(/^@\/registry\/(.+)\/ui/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/ui/,
      config.aliases.ui ?? `${config.aliases.components}/ui`,
    )
  }

  const registryFile = files?.find((f) => {
    if (f.type !== 'registry:file' || !f.target) {
      return false
    }

    const alias = config.aliases.components.split('/')[0]
    const pathWithAlias = `${alias}/${f.path}`.replace(/\.[^/.]+$/, '')

    return pathWithAlias === moduleSpecifier
  })

  if (
    config.aliases.components &&
    registryFile &&
    moduleSpecifier.match(/^@\/registry\/(.+)\/(components|lib|hooks|core|ui)/)
  ) {
    const aliasBase = getAliasBase(registryFile.target!, config)
    const modded = registryFile
      .target!.replace(/^components\//, `${aliasBase}/`)
      .replace(/\.[^/.]+$/, '')
    return modded
  }

  if (
    config.aliases.components &&
    moduleSpecifier.match(/^@\/registry\/(.+)\/components/)
  ) {
    console.log('here!')
    const registryFile = files?.find((f) => {
      if (f.type !== 'registry:file' || !f.target) {
        return false
      }

      const alias = config.aliases.components.split('/')[0]
      // remove file extension using regex
      const pathWithAlias = `${alias}/${f.path}`.replace(/\.[^/.]+$/, '')

      // console.log('pathWithAlias', pathWithAlias)
      // console.log('moduleSpecifier', moduleSpecifier)

      return pathWithAlias === moduleSpecifier

      // const aliasBase = getAliasBase(f.target, config)
      // const modded = f.target.replace(/^components\//, `${aliasBase}/`)

      // return modded === moduleSpecifier
    })

    if (registryFile) {
      // console.log('here AGAIN!')
      const aliasBase = getAliasBase(registryFile.target!, config)
      const modded = registryFile.target!.replace(
        /^components\//,
        `${aliasBase}/`,
      )
      return modded
    }

    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/components/,
      config.aliases.components,
    )
  }

  if (config.aliases.lib && moduleSpecifier.match(/^@\/registry\/(.+)\/lib/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/lib/,
      config.aliases.lib,
    )
  }

  if (
    config.aliases.hooks &&
    moduleSpecifier.match(/^@\/registry\/(.+)\/hooks/)
  ) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/hooks/,
      config.aliases.hooks,
    )
  }

  return moduleSpecifier.replace(
    /^@\/registry\/[^/]+/,
    config.aliases.components,
  )
}

function getAliasBase(targetPath: string, config: Config): string {
  if (targetPath.startsWith('components/')) {
    return config.aliases.components
  }
  if (targetPath.startsWith('lib/')) {
    return config.aliases.lib ?? ''
  }
  if (targetPath.startsWith('hooks/')) {
    return config.aliases.hooks ?? ''
  }
  if (targetPath.startsWith('ui/')) {
    return config.aliases.ui ?? `${config.aliases.components}/ui`
  }
  return config.aliases.components
}
