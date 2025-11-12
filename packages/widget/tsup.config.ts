import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/embed.js'],
    format: ['iife'],
    globalName: 'EchoWidget',
    outDir: 'dist',
    minify: true,
    sourcemap: false,
    treeshake: true,
    splitting: false,
    clean: true,
    noExternal: [/@echo\/shared/],
    banner: {
      js: '/*! Echo Widget v1.0.0 | MIT License */',
    },
  },
  {
    entry: ['src/index.tsx', 'src/react.tsx'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
  },
]);
