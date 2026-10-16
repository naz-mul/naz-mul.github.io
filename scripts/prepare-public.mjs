import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { preparePublic, writeHostingCsp } from './publication/artifact.mjs'

try {
  const { values } = parseArgs({
    options: {
      root: { type: 'string' }, build: { type: 'string' }, out: { type: 'string' },
      report: { type: 'string' }, 'write-hosting-csp': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log('Usage: node scripts/prepare-public.mjs [--root ROOT] [--build dist/site-build] [--out dist/public] [--report dist/publication-report.json] [--write-hosting-csp]\nValidates static routes and reachable public resources before replacing disposable output. The optional CSP flag synchronizes local firebase.json hashes; it never deploys.')
  } else {
    const root = resolve(values.root ?? process.cwd())
    const report = await preparePublic({
      root,
      ...(values.build ? { buildDir: resolve(root, values.build) } : {}),
      ...(values.out ? { outDir: resolve(root, values.out) } : {}),
      ...(values.report ? { reportPath: resolve(root, values.report) } : {}),
    })
    if (values['write-hosting-csp']) await writeHostingCsp({ root, report })
    console.log(JSON.stringify({
      artifact: values.out ?? 'dist/public', files: report.files.length,
      routes: report.routes.length, indexableRoutes: report.routes.filter((route) => route.indexable).length,
      artifactDigest: report.artifactDigest, report: values.report ?? 'dist/publication-report.json',
      hostingCspSynchronized: values['write-hosting-csp'],
    }, null, 2))
  }
} catch (error) {
  console.error(`Public artifact validation failed: ${error.message}`)
  process.exitCode = 1
}
