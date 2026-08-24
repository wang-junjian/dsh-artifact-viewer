/**
 * tsdown config for the browser half of this external UI plugin.
 *
 * DeepSeek Harness's shared `clientBundle` preset is not published and only
 * works for packages inside the monorepo workspace, so this file reproduces
 * the same lazy-CJS factory output format that `dsh-client-modules` serves
 * to the browser.
 *
 * @module tsdown.config
 */

import { readFile } from 'node:fs/promises'
import { transform } from 'lightningcss'
import type { UserConfig } from 'tsdown'

/** Package id stamped into the module-loader registration and style tags. */
const PLUGIN_ID = '@wang-junjian/dsh-artifact-viewer'

/**
 * Specifiers provided by the web shell's frozen module table. Every other
 * import (including third-party libraries) is inlined into the bundle.
 */
const MODULE_TABLE_EXTERNALS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-runtime/client',
])

function isModuleTableExternal(specifier: string): boolean {
  return MODULE_TABLE_EXTERNALS.has(specifier)
}

/** Virtual-id prefixes that keep CSS away from tsdown's own pipeline. */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

function styleInjectionModule(fileId: string, css: string, classMap?: Record<string, string>): string {
  const tagId = `${PLUGIN_ID}/${fileId.split('/').pop() ?? 'style'}`
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    '  const tag = document.createElement(\'style\');',
    `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

export default {
  name: `${PLUGIN_ID}/client`,
  entry: { client: 'lib/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: isModuleTableExternal,
    alwaysBundle: (specifier: string) => !isModuleTableExternal(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    // Purity gate: reject accidental value imports from other @deepseek-ai
    // packages that are not in the module table. Type-only imports are erased
    // before this runs.
    name: 'dsh-artifact-viewer-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (isModuleTableExternal(source)) return null
      throw new Error(
        `client bundle purity: "${source}" is not in the module table for ${PLUGIN_ID} — `
        + 'declare it in dsh.client.external or collaborate through cordis services',
      )
    },
  }, {
    // CSS Modules: compile and inject as a plugin-owned style tag.
    name: 'dsh-artifact-viewer-css-modules',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css') || importer === undefined) return null
      const resolved = new URL(source, `file://${importer}`).pathname
      // tsc emits JS next to the TS source but does not copy stylesheets, so map
      // the emitted lib/ path back to the src/ tree when necessary.
      const sourcePath = resolved.replace(/\/lib\//, '/src/')
      return CSS_VIRTUAL_PREFIX + sourcePath + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      const entries = Object.entries(cssExports ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      for (const [local, exp] of entries) classMap[local] = exp.name
      return styleInjectionModule(fileId, code.toString(), classMap)
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
} satisfies UserConfig
