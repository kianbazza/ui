import type { RegistryItem } from '@/src/registry/schema.js'
import type { Config } from '@/src/utils/get-config.js'
import { getPackageInfo } from '@/src/utils/get-package-info.js'
import { getPackageManager } from '@/src/utils/get-package-manager.js'
import { logger } from '@/src/utils/logger.js'
import { spinner } from '@/src/utils/spinner.js'
import { execa } from 'execa'
import prompts from 'prompts'

export async function updateDependencies(
  dependencies: RegistryItem['dependencies'],
  config: Config,
  options: {
    silent?: boolean
  },
) {
  // biome-ignore lint/style/noParameterAssign:
  dependencies = Array.from(new Set(dependencies))
  if (!dependencies?.length) {
    return
  }

  // biome-ignore lint/style/noParameterAssign:
  options = {
    silent: false,
    ...options,
  }

  const dependenciesSpinner = spinner('Installing dependencies.', {
    silent: options.silent,
  })?.start()
  const packageManager = await getPackageManager(config.resolvedPaths.cwd)

  // Offer to use --force or --legacy-peer-deps if using React 19 with npm.
  let flag = ''
  if (isUsingReact19(config) && packageManager === 'npm') {
    if (options.silent) {
      flag = 'force'
    } else {
      dependenciesSpinner.stopAndPersist()
      logger.warn(
        '\nIt looks like you are using React 19. \nSome packages may fail to install due to peer dependency issues in npm (see https://ui.shadcn.com/react-19).\n',
      )
      const confirmation = await prompts([
        {
          type: 'select',
          name: 'flag',
          message: 'How would you like to proceed?',
          choices: [
            { title: 'Use --force', value: 'force' },
            { title: 'Use --legacy-peer-deps', value: 'legacy-peer-deps' },
          ],
        },
      ])

      if (confirmation) {
        flag = confirmation.flag
      }
    }
  }

  dependenciesSpinner?.start()

  await execa(
    packageManager,
    [
      packageManager === 'npm' ? 'install' : 'add',
      ...(packageManager === 'npm' && flag ? [`--${flag}`] : []),
      ...dependencies,
    ],
    {
      cwd: config.resolvedPaths.cwd,
    },
  )

  dependenciesSpinner?.succeed()
}

function isUsingReact19(config: Config) {
  const packageInfo = getPackageInfo(config.resolvedPaths.cwd)

  if (!packageInfo?.dependencies?.react) {
    return false
  }

  return /^(?:\^|~)?19(?:\.\d+)*(?:-.*)?$/.test(packageInfo.dependencies.react)
}
