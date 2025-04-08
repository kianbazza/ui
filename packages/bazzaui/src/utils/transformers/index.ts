import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type {
  RegistryItem,
  registryBaseColorSchema,
} from '@/src/registry/schema.js'
import type { Config } from '@/src/utils/get-config.js'
import { transformCssVars } from '@/src/utils/transformers/transform-css-vars.js'
import { transformIcons } from '@/src/utils/transformers/transform-icons.js'
import { transformImport } from '@/src/utils/transformers/transform-import.js'
import { transformJsx } from '@/src/utils/transformers/transform-jsx.js'
import { transformRsc } from '@/src/utils/transformers/transform-rsc.js'
import { Project, ScriptKind, type SourceFile } from 'ts-morph'
import type { z } from 'zod'

import { transformTwPrefixes } from './transform-tw-prefix.js'

export type TransformOpts = {
  files: RegistryItem['files']
  filename: string
  raw: string
  config: Config
  baseColor?: z.infer<typeof registryBaseColorSchema>
  transformJsx?: boolean
  isRemote?: boolean
}

export type Transformer<Output = SourceFile> = (
  opts: TransformOpts & {
    sourceFile: SourceFile
  },
) => Promise<Output>

const project = new Project({
  compilerOptions: {},
})

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'shadcn-'))
  return path.join(dir, filename)
}

export async function transform(
  opts: TransformOpts,
  transformers: Transformer[] = [
    transformImport,
    transformRsc,
    transformCssVars,
    transformTwPrefixes,
    transformIcons,
  ],
) {
  const tempFile = await createTempSourceFile(opts.filename)
  const sourceFile = project.createSourceFile(tempFile, opts.raw, {
    scriptKind: ScriptKind.TSX,
  })

  for (const transformer of transformers) {
    await transformer({ sourceFile, ...opts })
  }

  if (opts.transformJsx) {
    return await transformJsx({
      sourceFile,
      ...opts,
    })
  }

  return sourceFile.getText()
}
