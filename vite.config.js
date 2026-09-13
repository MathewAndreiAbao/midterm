import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration. This is the whole build setup for the project.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
});
