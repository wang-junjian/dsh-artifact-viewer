import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/**/*.client.spec.tsx', 'jsdom'],
      ['tests/**/*.client.spec.ts', 'jsdom'],
    ],
  },
  resolve: {
    // Source files use .js extensions for NodeNext compatibility; vitest resolves
    // them back to the .ts source files during testing.
    alias: [
      { find: /^(\.\.?\/.*)\.js$/, replacement: '$1' },
      { find: /^react$/, replacement: '/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/node_modules/react' },
      { find: /^react-dom$/, replacement: '/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/node_modules/react-dom' },
      { find: /^react\/jsx-runtime$/, replacement: '/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/node_modules/react/jsx-runtime' },
    ],
  },
})
