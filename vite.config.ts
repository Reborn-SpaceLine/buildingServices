import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { adminServer } from './admin-server.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminServer()],
  server: {
    watch: {
      // Les envois de fichiers et les données privées ne doivent pas recharger la page d'admin
      ignored: ['**/public/uploads/**', '**/content-private/**'],
    },
  },
})
