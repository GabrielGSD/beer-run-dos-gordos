import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import { initGA } from './services/analytics'

// Inicializa o Google Analytics 4
initGA()

createApp(App).mount('#app')

