import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import { initGA } from './services/analytics'
import { capturePrivateAccessLink } from './services/private-access.js'

capturePrivateAccessLink()
// Inicializa o Google Analytics 4
initGA()

createApp(App).mount('#app')
