import { defineConfig } from 'vite'

// Deployed to GitHub Pages under /learn-watercolor/.
// In dev the base is '/' so local server works normally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/learn-watercolor/' : '/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}))
