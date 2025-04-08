#!/usr/bin/env node
import { add } from '@/src/commands/add'
import { Command } from 'commander'

import packageJson from '../package.json'

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

  program.addCommand(add)

  program.parse()
}

main()

export * from './registry/api'
