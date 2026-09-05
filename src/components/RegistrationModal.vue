<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="vintage-card modal-box">
      <button class="close-btn" @click="closeModal">&times;</button>

      <div v-if="!submitted" class="modal-content">
        <div class="modal-header">
          <img src="/logo.png" alt="Logo" class="modal-logo" />
          <h3 class="modal-title font-slab">INSCRIÇÃO BEER RUN DOS GORDOS</h3>
          <p class="modal-subtitle font-condensed">Garantia de chopp gelado, churrasco e muita diversão!</p>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="font-condensed">NOME COMPLETO</label>
            <input type="text" v-model="form.name" required placeholder="Ex: João da Cerveja" class="vintage-input font-condensed" />
          </div>

          <div class="form-group">
            <label class="font-condensed">E-MAIL</label>
            <input type="email" v-model="form.email" required placeholder="seuemail@exemplo.com" class="vintage-input font-condensed" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="font-condensed">MODALIDADE</label>
              <select v-model="form.modality" class="vintage-input font-condensed">
                <option value="corrida">Corrida 6.37 KM</option>
                <option value="caminhada">Caminhada 6.37 KM</option>
              </select>
            </div>

            <div class="form-group">
              <label class="font-condensed">TAMANHO CAMISETA</label>
              <select v-model="form.shirtSize" class="vintage-input font-condensed">
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="XGG">XGG</option>
                <option value="EXG">EXG (Super Gordo)</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn-vintage submit-btn">
            <i class="fa-solid fa-check"></i> CONFIRMAR PRÉ-INSCRIÇÃO
          </button>
        </form>
      </div>

      <!-- Success Confirmation State -->
      <div v-else class="success-box">
        <div class="stamp-circle">
          <span>APROVADO</span>
          <i class="fa-solid fa-beer-mug-empty"></i>
        </div>
        <h3 class="success-title font-slab">PRÉ-INSCRIÇÃO GARANTIDA!</h3>
        <p class="success-desc font-condensed">
          Parabéns <strong>{{ form.name }}</strong>! Você deu o primeiro passo rumo à corrida mais honesta do ano. Enviamos os detalhes de pagamento e confirmação para <strong>{{ form.email }}</strong>.
        </p>
        <button class="btn-vintage" @click="closeModal">FECHAR</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const submitted = ref(false)
const form = reactive({
  name: '',
  email: '',
  modality: 'corrida',
  shirtSize: 'GG'
})

function handleSubmit() {
  submitted.value = true
}

function closeModal() {
  submitted.value = false
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(25, 23, 20, 0.75);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-box {
  width: 100%;
  max-width: 520px;
  background-color: var(--bg-parchment-light);
  padding: 32px;
  border-radius: 8px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--accent-dark);
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-logo {
  height: 48px;
  margin-bottom: 8px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-dark);
}

.modal-subtitle {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-green);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-dark);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.vintage-input {
  padding: 10px 14px;
  font-size: 1.05rem;
  font-weight: 700;
  background-color: #fff;
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  color: var(--text-dark);
  outline: none;
}

.vintage-input:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(217, 130, 43, 0.2);
}

.submit-btn {
  margin-top: 8px;
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stamp-circle {
  width: 100px;
  height: 100px;
  border: 4px dashed var(--accent-green);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--accent-green);
  font-weight: 900;
  margin-bottom: 16px;
  transform: rotate(-10deg);
}

.stamp-circle i {
  font-size: 2rem;
}

.success-title {
  font-size: 1.6rem;
  font-weight: 900;
  margin-bottom: 12px;
}

.success-desc {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-muted);
}
</style>
