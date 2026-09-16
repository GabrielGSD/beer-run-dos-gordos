<template>
  <div v-if="isOpen" class="staff-modal-backdrop animate-fade-in" @click.self="$emit('close')">
    <div class="staff-login-card vintage-card animate-slide-up">
      <!-- Seal Header -->
      <div class="modal-seal-badge font-slab">
        ★ ÁREA RESTRITA ★
      </div>

      <button class="modal-close-btn" @click="$emit('close')" aria-label="Fechar">✕</button>

      <div class="login-header text-center">
        <div class="vintage-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <h2 class="font-slab login-title">ACESSO DO STAFF</h2>
        <p class="login-sub font-condensed">
          Painel de controle oficial da Beer Run dos Gordos. Digite a senha mestre de organizador para continuar.
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="staff-pin" class="form-label font-slab">SENHA / PIN DE ADMIN</label>
          <div class="input-wrap">
            <input
              id="staff-pin"
              ref="pinInputRef"
              :type="showPassword ? 'text' : 'password'"
              v-model="pinInput"
              placeholder="Digite o PIN da organização..."
              autocomplete="current-password"
              class="form-input font-condensed"
              required
            />
            <button
              type="button"
              class="toggle-pwd-btn"
              @click="showPassword = !showPassword"
              title="Mostrar/Ocultar"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner animate-shake font-condensed">
          <i class="fa-solid fa-triangle-exclamation"></i>
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel font-condensed" @click="$emit('close')">
            CANCELAR
          </button>
          <button type="submit" class="btn-vintage btn-submit font-slab">
            <i class="fa-solid fa-key"></i> ENTRAR NO PAINEL
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useStaff } from '../composables/useStaff.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'authenticated'])

const { login } = useStaff()

const pinInput = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const pinInputRef = ref(null)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    pinInput.value = ''
    errorMessage.value = ''
    showPassword.value = false
    nextTick(() => {
      if (pinInputRef.value) {
        pinInputRef.value.focus()
      }
    })
  }
})

function handleLogin() {
  errorMessage.value = ''
  const success = login(pinInput.value)
  if (success) {
    pinInput.value = ''
    emit('authenticated')
    emit('close')
  } else {
    errorMessage.value = 'Senha incorreta! Verifique com a comissão organizadora.'
  }
}
</script>

<style scoped>
.staff-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(20, 16, 11, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9999;
}

.staff-login-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--bg-parchment-light, #fbf7ee);
  border: 4px solid var(--accent-border, #2c271f);
  box-shadow: 10px 10px 0px rgba(44, 39, 31, 0.8);
  padding: 36px 28px 28px;
  color: var(--text-dark, #1c1b18);
  border-radius: 4px;
}

.modal-seal-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-gold, #d9822b);
  color: #fff;
  padding: 4px 18px;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 1px;
  border: 2px solid var(--accent-border, #2c271f);
  box-shadow: 2px 2px 0px #000;
  white-space: nowrap;
}

.modal-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  color: var(--text-muted, #4e483d);
  transition: transform 0.2s, color 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  transform: scale(1.15) rotate(90deg);
  color: #b3261e;
}

.login-header {
  margin-bottom: 24px;
}

.vintage-icon {
  font-size: 2.5rem;
  color: var(--accent-gold, #d9822b);
  margin-bottom: 8px;
}

.login-title {
  font-size: 1.6rem;
  letter-spacing: 0.5px;
  color: var(--text-dark, #1c1b18);
  margin-bottom: 6px;
}

.login-sub {
  font-size: 0.95rem;
  color: var(--text-muted, #4e483d);
  line-height: 1.35;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-dark, #1c1b18);
  letter-spacing: 0.5px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 12px 42px 12px 14px;
  font-size: 1.1rem;
  border: 2px solid var(--accent-border, #2c271f);
  background: #fff;
  color: var(--text-dark, #1c1b18);
  border-radius: 2px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: var(--accent-gold, #d9822b);
  box-shadow: 0 0 0 3px rgba(217, 130, 43, 0.2);
}

.toggle-pwd-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted, #4e483d);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
}

.error-banner {
  background: #ffebee;
  color: #b71c1c;
  border: 1px solid #ffcdd2;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 3px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  background: transparent;
  border: 2px solid transparent;
  color: var(--text-muted, #4e483d);
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-dark, #1c1b18);
}

.btn-submit {
  padding: 12px 22px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
</style>
