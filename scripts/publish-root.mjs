import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { publishRoot, rollbackRoot } from './publication/publisher.mjs'

try {
  const { values } = parseArgs({
    options: {
      root: { type: 'string' }, artifact: { type: 'string' }, report: { type: 'string' },
      'legacy-inventory': { type: 'string' }, rollback: { type: 'string' },
      apply: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log('Usage: node scripts/publish-root.mjs [--root ROOT] [--artifact dist/public] [--report dist/publication-report.json] [--legacy-inventory PATH] [--apply]\nRollback: node scripts/publish-root.mjs --rollback dist/publication-backups/TRANSACTION [--root ROOT] [--apply]\nBoth commands are dry-run by default. Root writes require --apply and a matching reviewed ownership inventory. No commit, push or remote deployment is performed.')
  } else {
    const root = resolve(values.root ?? process.cwd())
    if (values.rollback && (values.artifact || values.report || values['legacy-inventory'])) throw new Error('Rollback cannot be combined with publication inputs.')
    const result = values.rollback
      ? await rollbackRoot({ root, transactionDir: resolve(root, values.rollback), apply: values.apply })
      : await publishRoot({
        root, apply: values.apply,
        ...(values.artifact ? { artifactDir: resolve(root, values.artifact) } : {}),
        ...(values.report ? { reportPath: resolve(root, values.report) } : {}),
        ...(values['legacy-inventory'] ? { legacyInventoryPath: resolve(root, values['legacy-inventory']) } : {}),
      })
    console.log(JSON.stringify(result, null, 2))
  }
} catch (error) {
  console.error(`Root publication refused: ${error.message}`)
  process.exitCode = 1
}
