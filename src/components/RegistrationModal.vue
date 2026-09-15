<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="vintage-card modal-box">
      <button class="close-btn" @click="closeModal" aria-label="Fechar">&times;</button>

      <!-- 1. Estado de Sucesso -->
      <div v-if="submitted" class="success-box">
        <div class="stamp-circle">
          <span>APROVADO</span>
          <i class="fa-solid fa-beer-mug-empty"></i>
        </div>
        <h3 class="success-title font-slab">PRÉ-INSCRIÇÃO GARANTIDA!</h3>
        <p class="success-desc font-condensed">
          Parabéns <strong>{{ confirmedDisplayName }}</strong>! Você deu o primeiro passo rumo à corrida mais honesta do ano. Entraremos em contato via WhatsApp no número <strong>{{ form.phone }}</strong> com todos os detalhes e confirmação.
        </p>
        <button class="btn-vintage modal-btn-close font-slab" @click="closeModal">FECHAR</button>
      </div>

      <!-- 2. Estado de Vagas Esgotadas -->
      <div v-else-if="isSoldOut" class="soldout-box">
        <div class="stamp-circle soldout-stamp">
          <span>★ ESGOTADO ★</span>
          <i class="fa-solid fa-lock"></i>
        </div>
        <h3 class="soldout-title font-slab">INSCRIÇÕES ESGOTADAS!</h3>
        <p class="soldout-desc font-condensed">
          As vagas para a <strong>Beer Run dos Gordos</strong> estão esgotadas no momento! Agradecemos a todos pela incrível adesão e carinho.
        </p>

        <div class="waitlist-card font-condensed">
          <p>
            📋 <strong>Deseja entrar na Lista de Espera?</strong> Caso haja alguma desistência ou abertura de novo lote, avisaremos você com prioridade!
          </p>
        </div>

        <div class="soldout-actions">
          <a
            href="https://wa.me/5535997500430?text=Ol%C3%A1!%20Gostaria%20de%20entrar%20na%20lista%20de%20espera%20da%20Beer%20Run%20dos%20Gordos%20caso%20abra%20alguma%20vaga!"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-vintage waitlist-btn font-slab"
          >
            <i class="fa-brands fa-whatsapp"></i> ENTRAR NA LISTA DE ESPERA
          </a>

          <button class="btn-vintage modal-btn-close font-slab" @click="closeModal">FECHAR</button>
        </div>
      </div>

      <!-- 3. Formulário de Inscrição Ativo -->
      <div v-else class="modal-content">
        <div class="modal-header">
          <img src="/logo.png" alt="Logo" class="modal-logo" />
          <h3 class="modal-title font-slab">PRÉ-INSCRIÇÃO</h3>
          <p class="modal-subtitle font-condensed">Garantia de chopp gelado, churrasco e diversão!</p>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="submitError" class="error-banner font-condensed">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ submitError }}</span>
          </div>

          <div class="form-group">
            <label class="font-condensed">NOME COMPLETO</label>
            <input
              type="text"
              v-model="form.name"
              required
              placeholder="Ex: João da Silva"
              class="vintage-input font-condensed"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <div class="label-with-hint">
              <label class="font-condensed">APELIDO / NOME DE GUERRA</label>
              <span class="optional-hint font-condensed">(OPCIONAL)</span>
            </div>
            <input
              type="text"
              v-model="form.nickname"
              placeholder="Ex: Mestre Cervejeiro, Gordo Raiz..."
              class="vintage-input font-condensed"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label class="font-condensed">CELULAR (WHATSAPP)</label>
            <input
              type="tel"
              v-model="form.phone"
              @input="formatPhone"
              maxlength="15"
              required
              placeholder="(12) 99999-9999"
              class="vintage-input font-condensed"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-row">
            <div class="form-group modality-col">
              <label class="font-condensed">MODALIDADE</label>
              <select
                v-model="form.modality"
                class="vintage-input vintage-select font-condensed"
                :disabled="isSubmitting"
              >
                <option value="corrida">Corrida 6.37 KM</option>
                <option value="caminhada">Caminhada 6.37 KM</option>
              </select>
            </div>

            <div class="form-group beer-col">
              <label class="font-condensed">BEBE CHOPP? 🍺</label>
              <div class="beer-toggle-row">
                <button
                  type="button"
                  :disabled="isSubmitting"
                  :class="['toggle-btn', { active: form.drinksBeer === true }]"
                  @click="form.drinksBeer = true"
                >
                  SIM
                </button>
                <button
                  type="button"
                  :disabled="isSubmitting"
                  :class="['toggle-btn', { active: form.drinksBeer === false }]"
                  @click="form.drinksBeer = false"
                >
                  NÃO
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="btn-vintage submit-btn font-slab"
            :disabled="isSubmitting"
          >
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            {{ isSubmitting ? 'CONFIRMANDO...' : 'CONFIRMAR PRÉ-INSCRIÇÃO' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAthletes } from '../composables/useAthletes.js'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const {
  addAthlete,
  formatAthleteDisplayName,
  isSoldOut,
  remainingSpots,
  maxAthletes
} = useAthletes()

const submitted = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')

const form = reactive({
  name: '',
  nickname: '',
  phone: '',
  modality: 'corrida',
  drinksBeer: true
})

const confirmedDisplayName = computed(() => {
  return formatAthleteDisplayName(form.name, form.nickname)
})

function formatPhone(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 11) value = value.slice(0, 11)

  if (value.length > 6) {
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
  } else if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`
  } else if (value.length > 0) {
    value = `(${value}`
  }
  form.phone = value
}

async function handleSubmit() {
  submitError.value = ''
  isSubmitting.value = true

  try {
    await addAthlete({
      name: form.name,
      nickname: form.nickname,
      phone: form.phone,
      modality: form.modality,
      drinksBeer: form.drinksBeer
    })
    submitted.value = true
  } catch (err) {
    console.error('Falha ao processar inscrição:', err)
    if (err.message) {
      submitError.value = err.message
    } else {
      submitError.value = 'Não foi possível concluir a inscrição. Verifique sua conexão e tente novamente.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function closeModal() {
  submitted.value = false
  submitError.value = ''
  isSubmitting.value = false
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background-color: rgba(25, 23, 20, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.modal-box {
  width: 100%;
  max-width: 460px;
  max-height: calc(100dvh - 28px);
  background-color: #eeddbb;
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  padding: 20px 18px 16px;
  border-radius: 8px;
  border: 2px solid #1c1b18;
  box-shadow: 4px 4px 0px #1c1b18, 0 12px 28px rgba(0, 0, 0, 0.35);
  position: relative;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #d9822b transparent;
}

.modal-box::-webkit-scrollbar {
  width: 4px;
}
.modal-box::-webkit-scrollbar-thumb {
  background: #d9822b;
  border-radius: 4px;
}

.close-btn {
  position: absolute;
  top: 6px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #1c1b18;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  z-index: 10;
  transition: transform 0.15s ease;
}

.close-btn:hover {
  transform: scale(1.15);
}

.modal-header {
  text-align: center;
  margin-bottom: 12px;
}

.modal-logo {
  height: 36px;
  margin-bottom: 3px;
  object-fit: contain;
}

.modal-title {
  font-size: 1.22rem;
  font-weight: 900;
  color: #1c1b18;
  line-height: 1.15;
  margin-bottom: 2px;
  letter-spacing: -0.2px;
}

.modal-subtitle {
  font-size: 0.85rem;
  font-weight: 700;
  color: #354c23;
  line-height: 1.2;
}

.spots-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: #ffe8d1;
  border: 1.5px solid #d8812a;
  color: #9c4b05;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: 14px;
  margin-top: 6px;
  letter-spacing: 0.3px;
}

.spots-badge i {
  color: #e65100;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #ffe5e5;
  border: 1.5px solid #d93838;
  color: #a01c1c;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.label-with-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.optional-hint {
  font-size: 0.72rem;
  font-weight: 800;
  color: #a45a16;
  letter-spacing: 0.3px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #1c1b18;
  letter-spacing: 0.3px;
}

.form-row {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 10px;
  align-items: end;
}

.beer-toggle-row {
  display: flex;
  flex-direction: row;
  gap: 4px;
  width: 100%;
  height: 38px;
}

.toggle-btn {
  flex: 1;
  height: 100%;
  padding: 0 4px;
  font-family: var(--font-condensed);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  border: 2px solid #1c1b18;
  border-radius: 6px;
  background-color: #fff;
  color: #1c1b18;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.toggle-btn.active {
  background-color: #d8812a;
  border-color: #1c1b18;
  color: #1c1b18;
  box-shadow: 1px 1px 0px #1c1b18;
}

.toggle-btn:not(.active):hover:not(:disabled) {
  background-color: #f7eee0;
}

.toggle-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.vintage-input {
  padding: 7px 10px;
  height: 38px;
  box-sizing: border-box;
  font-size: 0.92rem;
  font-weight: 700;
  background-color: #fff;
  border: 2px solid #1c1b18;
  border-radius: 6px;
  color: #1c1b18;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.vintage-select {
  cursor: pointer;
}

.vintage-input:focus {
  border-color: #d8812a;
  box-shadow: 0 0 0 2px rgba(216, 129, 42, 0.25);
}

.vintage-input:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

.submit-btn {
  margin-top: 4px;
  width: 100%;
  padding: 10px 14px;
  font-size: 0.98rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.modal-btn-close {
  width: 100%;
  padding: 9px;
  margin-top: 4px;
}

.success-box {
  text-align: center;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stamp-circle {
  width: 80px;
  height: 80px;
  border: 3px dashed #354c23;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #354c23;
  font-weight: 900;
  margin-bottom: 12px;
  transform: rotate(-8deg);
}

.stamp-circle i {
  font-size: 1.5rem;
}

.success-title {
  font-size: 1.3rem;
  font-weight: 900;
  margin-bottom: 8px;
  color: #1c1b18;
}

.success-desc {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 18px;
  color: #4a453e;
  line-height: 1.35;
}

/* Sold Out State Styles */
.soldout-box {
  text-align: center;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.soldout-stamp {
  border-color: #b71c1c;
  color: #b71c1c;
  background: rgba(183, 28, 28, 0.08);
}

.soldout-stamp span {
  font-size: 0.72rem;
  letter-spacing: 0.5px;
}

.soldout-title {
  font-size: 1.3rem;
  font-weight: 900;
  margin-bottom: 6px;
  color: #b71c1c;
}

.soldout-desc {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 14px;
  color: #3b352b;
  line-height: 1.35;
}

.waitlist-card {
  background-color: #fff;
  border: 2px dashed #1c1b18;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 0.88rem;
  color: #1c1b18;
  text-align: left;
}

.soldout-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.waitlist-btn {
  background-color: #25d366;
  border-color: #1c1b18;
  color: #1c1b18;
  font-size: 0.95rem;
  padding: 10px 12px;
  box-shadow: 3px 3px 0px #1c1b18;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.waitlist-btn:hover {
  background-color: #1ebd5a;
}

@media (max-width: 480px) {
  .modal-box {
    padding: 16px 12px 14px;
    max-height: calc(100dvh - 20px);
  }

  .modal-logo {
    height: 32px;
  }

  .modal-title {
    font-size: 1.15rem;
  }

  .modal-subtitle {
    font-size: 0.8rem;
  }

  .modal-form {
    gap: 8px;
  }

  .form-row {
    grid-template-columns: 1.15fr 0.85fr;
    gap: 8px;
  }

  .toggle-btn {
    font-size: 0.76rem;
  }
}
</style>
