import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync('C:/certs/localhost+2-key.pem'),
      cert: fs.readFileSync('C:/certs/localhost+2.pem'),
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
