import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@cloudinary/url-gen', '@cloudinary/react']
  },
  build: {
    commonjsOptions: {
      include: [/@cloudinary\/url-gen/, /@cloudinary\/react/]
    }
  }
});
