import path from 'node:path'
import fs from 'fs-extra'
import type { PackageJson } from 'type-fest'

export function getPackageInfo(
  cwd = '',
  shouldThrow = true,
): PackageJson | null {
  const packageJsonPath = path.join(cwd, 'package.json')

  return fs.readJSONSync(packageJsonPath, {
    throws: shouldThrow,
  }) as PackageJson
}
