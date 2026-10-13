// Bundles the functions with esbuild so @cookie-voting/shared (a workspace package
// with no build step) is inlined, then writes a package.json that lists only the
// npm-published runtime dependencies. `functions/dist` is what Firebase deploys.
import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'))
const outdir = new URL('./dist/', import.meta.url)

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

await build({
  entryPoints: [new URL('./src/index.ts', import.meta.url).pathname],
  outfile: new URL('./index.js', outdir).pathname,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
  logLevel: 'info',
})

await writeFile(
  new URL('./package.json', outdir),
  `${JSON.stringify(
    {
      name: 'cookie-voting-functions',
      private: true,
      type: 'module',
      main: 'index.js',
      engines: { node: '22' },
      dependencies: pkg.dependencies,
    },
    null,
    2,
  )}\n`,
)
