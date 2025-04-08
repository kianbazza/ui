#!/usr/bin/env node
import { add } from '@/src/commands/add.js'
import { build } from '@/src/commands/build.js'
import { diff } from '@/src/commands/diff.js'
import { info } from '@/src/commands/info.js'
import { init } from '@/src/commands/init.js'
import { migrate } from '@/src/commands/migrate.js'
import { Command } from 'commander'

import packageJson from '../package.json' with { type: 'json' }

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

async function main() {
  const program = new Command()
    .name('bazzaui')
    .description('add components and dependencies to your project')
    .version(
      packageJson.version || '1.0.0',
      '-v, --version',
      'display the version number',
    )

  program
    .addCommand(init)
    .addCommand(add)
    .addCommand(diff)
    .addCommand(migrate)
    .addCommand(info)
    .addCommand(build)

  program.parse()
}

main()

export * from './registry/api.js'
