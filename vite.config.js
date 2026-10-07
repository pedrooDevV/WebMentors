import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],

    define: {
        global: 'globalThis'
<<<<<<< HEAD
    },

    base: '/mentorsWeb/',
=======
    }
>>>>>>> fb422bf1b66b27cedd2bc4e1c818ea40b5d74b82
})