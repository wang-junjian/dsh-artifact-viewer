import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/**/*.client.spec.tsx', 'jsdom'],
      ['tests/**/*.client.spec.ts', 'jsdom'],
    ],
    server: {
      deps: {
        inline: [/@deepseek-ai/],
      },
    },
  },
  resolve: {
    // Source files use .js extensions for NodeNext compatibility; vitest resolves
    // them back to the .ts source files during testing.
    alias: [
      { find: /^(\.\.?\/.*)\.js$/, replacement: '$1' },
      { find: /^react$/, replacement: `${root}node_modules/react` },
      { find: /^react-dom$/, replacement: `${root}node_modules/react-dom` },
      { find: /^react\/jsx-runtime$/, replacement: `${root}node_modules/react/jsx-runtime` },
    ],
  },
})
