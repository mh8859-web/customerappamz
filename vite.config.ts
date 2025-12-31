
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // AWS SDK v3 requires these globals to be defined in a browser environment
    global: 'window',
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
