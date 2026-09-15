<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="vintage-card modal-box">
      <button class="close-btn" @click="closeModal" aria-label="Fechar">&times;</button>

      <!-- Form View -->
      <div v-if="!submitted" class="modal-content">
        <div class="modal-header">
          <div class="sponsor-badge-header font-slab">
            <i class="fa-solid fa-star"></i> PATROCÍNIO OFICIAL <i class="fa-solid fa-star"></i>
          </div>
          <h3 class="modal-title font-slab">QUER SUA MARCA NA BEER RUN?</h3>
          <p class="modal-subtitle font-condensed">
            Apresente sua empresa para centenas de atletas, famílias e apaixonados por esporte e chopp gelado!
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="submitError" class="error-banner font-condensed">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ submitError }}</span>
          </div>

          <!-- Section 1: Informações da Empresa & Contato -->
          <div class="form-section-title font-slab">
            <i class="fa-solid fa-building"></i> 1. DADOS DA EMPRESA & CONTATO
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="font-condensed">NOME DA EMPRESA / MARCA *</label>
              <input
                type="text"
                v-model="form.companyName"
                required
                placeholder="Ex: Cervejaria Artesanal Silva"
                class="vintage-input font-condensed"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <label class="font-condensed">NOME DO RESPONSÁVEL *</label>
              <input
                type="text"
                v-model="form.contactName"
                required
                placeholder="Ex: Carlos (Proprietário)"
                class="vintage-input font-condensed"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="font-condensed">WHATSAPP DE CONTATO (COM DDD) *</label>
              <input
                type="tel"
                v-model="form.phone"
                @input="formatPhone"
                maxlength="15"
                required
                placeholder="(35) 99999-9999"
                class="vintage-input font-condensed"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <div class="label-with-hint">
                <label class="font-condensed">INSTAGRAM OU SITE</label>
                <span class="optional-hint font-condensed">(OPCIONAL)</span>
              </div>
              <input
                type="text"
                v-model="form.websiteInstagram"
                placeholder="@suamarca ou www.site.com.br"
                class="vintage-input font-condensed"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- Section 2: Formato do Patrocínio -->
          <div class="form-section-title font-slab">
            <i class="fa-solid fa-handshake"></i> 2. FORMATO DA PARCERIA
          </div>

          <div class="sponsor-types-grid">
            <button
              type="button"
              :class="['type-card', { active: form.sponsorshipType === 'money' }]"
              @click="form.sponsorshipType = 'money'"
              :disabled="isSubmitting"
            >
              <div class="type-icon">💵</div>
              <div class="type-title font-slab">FINANCEIRO (R$)</div>
              <div class="type-desc font-condensed">Apoio em dinheiro para estrutura e troféus</div>
            </button>

            <button
              type="button"
              :class="['type-card', { active: form.sponsorshipType === 'gifts' }]"
              @click="form.sponsorshipType = 'gifts'"
              :disabled="isSubmitting"
            >
              <div class="type-icon">🎁</div>
              <div class="type-title font-slab">BRINDES / KIT</div>
              <div class="type-desc font-condensed">Produtos, copos, tirantes, vouchers, chopp</div>
            </button>

            <button
              type="button"
              :class="['type-card', { active: form.sponsorshipType === 'structure' }]"
              @click="form.sponsorshipType = 'structure'"
              :disabled="isSubmitting"
            >
              <div class="type-icon">🎪</div>
              <div class="type-title font-slab">ESTRUTURA</div>
              <div class="type-desc font-condensed">Tendas, som, foto/vídeo, serviços</div>
            </button>

            <button
              type="button"
              :class="['type-card', { active: form.sponsorshipType === 'mixed' }]"
              @click="form.sponsorshipType = 'mixed'"
              :disabled="isSubmitting"
            >
              <div class="type-icon">🤝</div>
              <div class="type-title font-slab">MISTO</div>
              <div class="type-desc font-condensed">R$ + Produtos ou serviços</div>
            </button>
          </div>

          <!-- Condicional: Valor em R$ se for financeiro ou misto -->
          <div
            v-if="form.sponsorshipType === 'money' || form.sponsorshipType === 'mixed'"
            class="form-group support-detail-box"
          >
            <label class="font-condensed">VALOR DA COTA ESTIMADA (R$)</label>
            <div class="preset-amounts-row">
              <button
                type="button"
                v-for="preset in ['R$ 50', 'R$ 100', 'R$ 250', 'R$ 500']"
                :key="preset"
                :class="['preset-btn', { active: form.amount === preset }]"
                @click="form.amount = preset"
              >
                {{ preset }}
              </button>
            </div>
            <input
              type="text"
              v-model="form.amount"
              placeholder="Ou digite outro valor (ex: R$ 350)"
              class="vintage-input font-condensed"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Condicional: Descrição de Brindes/Produtos/Estrutura -->
          <div
            v-if="form.sponsorshipType === 'gifts' || form.sponsorshipType === 'structure' || form.sponsorshipType === 'mixed'"
            class="form-group support-detail-box"
          >
            <label class="font-condensed">O QUE VOCÊ GOSTARIA DE FORNECER? (ITENS & QUANTIDADE ESTIMADA)</label>
            <textarea
              v-model="form.itemsDescription"
              rows="2"
              placeholder="Ex: 100 tirantes de caneca personalizados + 2 barris de 50L de chopp artesanal para o pós-prova."
              class="vintage-input vintage-textarea font-condensed"
              :disabled="isSubmitting"
            ></textarea>
          </div>

          <!-- Section 3: Logo da Empresa -->
          <div class="form-section-title font-slab">
            <i class="fa-solid fa-image"></i> 3. LOGOTIPO DA SUA MARCA
          </div>

          <div class="logo-upload-box">
            <div v-if="!logoPreview" class="upload-dropzone" @click="triggerFileInput">
              <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
              <div class="upload-text font-slab">CLIQUE PARA ENVIAR A LOGO</div>
              <div class="upload-sub font-condensed">Formatos aceitos: PNG, SVG ou JPG (Fundo transparente preferencial)</div>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                @change="handleFileSelected"
                class="hidden-file-input"
              />
            </div>

            <!-- Logo Preview Card -->
            <div v-else class="logo-preview-card">
              <div class="preview-img-container">
                <img :src="logoPreview" alt="Preview da Logo" class="preview-img" />
              </div>
              <div class="preview-info">
                <span class="preview-name font-slab">{{ logoFileName || 'Logo Selecionada' }}</span>
                <span class="preview-status font-condensed"><i class="fa-solid fa-check"></i> Pronta para aplicação</span>
              </div>
              <button
                type="button"
                class="remove-logo-btn"
                @click="removeLogo"
                title="Remover / Trocar Logo"
              >
                <i class="fa-solid fa-trash-can"></i> Trocar
              </button>
            </div>
          </div>

          <!-- Section 4: Ativação Presencial & Ideias -->
          <div class="form-section-title font-slab">
            <i class="fa-solid fa-bullhorn"></i> 4. ATIVAÇÕES DE INTERESSE
          </div>

          <div class="activations-grid">
            <label
              v-for="opt in activationOptions"
              :key="opt.id"
              class="activation-checkbox-label font-condensed"
            >
              <input
                type="checkbox"
                :value="opt.label"
                v-model="form.activations"
                class="vintage-checkbox"
                :disabled="isSubmitting"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>

          <!-- Section 5: Observações adicionais -->
          <div class="form-group">
            <div class="label-with-hint">
              <label class="font-condensed">MENSAGEM OU SUGESTÃO ADICIONAL</label>
              <span class="optional-hint font-condensed">(OPCIONAL)</span>
            </div>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Conte-nos se tem alguma ideia especial para surpreender os corredores..."
              class="vintage-input vintage-textarea font-condensed"
              :disabled="isSubmitting"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-vintage submit-btn font-slab"
            :disabled="isSubmitting"
          >
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-paper-plane"></i>
            {{ isSubmitting ? 'ENVIANDO PROPOSTA...' : 'ENVIAR PROPOSTA DE PATROCÍNIO' }}
          </button>
        </form>
      </div>

      <!-- Success State -->
      <div v-else class="success-box">
        <div class="stamp-circle">
          <span>★ RECEBIDO ★</span>
          <i class="fa-solid fa-handshake-simple"></i>
        </div>

        <h3 class="success-title font-slab">PROPOSTA ENVIADA COM SUCESSO!</h3>
        
        <p class="success-desc font-condensed">
          Muito obrigado, <strong>{{ form.contactName }}</strong>! A proposta da <strong>{{ form.companyName }}</strong> já está com a comissão organizadora da Beer Run dos Gordos.
        </p>

        <div class="success-highlight-card font-condensed">
          <p>
            🚀 <strong>Quer agilizar o fechamento?</strong> Você pode enviar uma notificação direta no nosso WhatsApp com os detalhes da sua proposta clicando no botão abaixo:
          </p>
        </div>

        <div class="success-actions">
          <a
            :href="submittedWhatsAppUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-vintage whatsapp-btn font-slab"
          >
            <i class="fa-brands fa-whatsapp"></i> AVISAR ORGANIZAÇÃO NO WHATSAPP
          </a>

          <button class="btn-vintage modal-btn-close font-slab" @click="closeModal">
            CONCLUIR E FECHAR
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSponsorshipProposal } from '../composables/useSponsorshipProposal.js'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const { submitProposal } = useSponsorshipProposal()

const submitted = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submittedWhatsAppUrl = ref('')

const fileInputRef = ref(null)
const logoPreview = ref('')
const logoFileName = ref('')
const logoFileObject = ref(null)

const activationOptions = [
  { id: 1, label: '🎪 Tenda / Estande próprio no local do evento' },
  { id: 2, label: '🏆 Sorteio ou premiação de produtos no palco' },
  { id: 3, label: '🎟️ Cupom de desconto exclusivo no kit do atleta' },
  { id: 4, label: '📢 Logomarca nos banners e divulgação digital' }
]

const form = reactive({
  companyName: '',
  contactName: '',
  phone: '',
  websiteInstagram: '',
  sponsorshipType: 'money',
  amount: '',
  itemsDescription: '',
  activations: [
    '📢 Logomarca nos banners e divulgação digital'
  ],
  notes: ''
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

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    alert('O arquivo de imagem é muito grande. Por favor envie uma imagem de até 5MB.')
    return
  }

  logoFileName.value = file.name
  logoFileObject.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  logoPreview.value = ''
  logoFileName.value = ''
  logoFileObject.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleSubmit() {
  submitError.value = ''
  isSubmitting.value = true

  try {
    const result = await submitProposal({
      companyName: form.companyName,
      contactName: form.contactName,
      phone: form.phone,
      websiteInstagram: form.websiteInstagram,
      sponsorshipType: form.sponsorshipType,
      amount: form.amount,
      itemsDescription: form.itemsDescription,
      activations: form.activations,
      notes: form.notes,
      logoFile: logoFileObject.value,
      logoPreview: logoPreview.value
    })

    submittedWhatsAppUrl.value = result.whatsAppUrl
    submitted.value = true
  } catch (err) {
    console.error('Falha ao enviar proposta de patrocínio:', err)
    submitError.value = err.message || 'Não foi possível enviar sua proposta. Tente novamente ou entre em contato.'
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
  background-color: rgba(25, 23, 20, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.modal-box {
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 32px);
  background-color: #eeddbb;
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
  padding: 24px 22px 20px;
  border-radius: 8px;
  border: 2.5px solid #1c1b18;
  box-shadow: 5px 5px 0px #1c1b18, 0 16px 36px rgba(0, 0, 0, 0.4);
  position: relative;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #d9822b transparent;
}

.modal-box::-webkit-scrollbar {
  width: 5px;
}
.modal-box::-webkit-scrollbar-thumb {
  background: #d9822b;
  border-radius: 4px;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #1c1b18;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  z-index: 10;
  transition: transform 0.15s ease, color 0.15s ease;
}

.close-btn:hover {
  transform: scale(1.15);
  color: #c4711e;
}

.modal-header {
  text-align: center;
  margin-bottom: 16px;
}

.sponsor-badge-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #1c1b18;
  color: #d9822b;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 6px;
}

.sponsor-badge-header i {
  font-size: 0.7rem;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 900;
  color: #1c1b18;
  line-height: 1.2;
  margin-bottom: 4px;
  letter-spacing: -0.2px;
}

.modal-subtitle {
  font-size: 0.88rem;
  font-weight: 700;
  color: #4e483d;
  line-height: 1.3;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 900;
  color: #1c1b18;
  border-bottom: 1.5px dashed rgba(28, 27, 24, 0.35);
  padding-bottom: 4px;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #1c1b18;
  letter-spacing: 0.3px;
}

.vintage-input {
  padding: 8px 10px;
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

.vintage-input:focus {
  border-color: #d8812a;
  box-shadow: 0 0 0 2px rgba(216, 129, 42, 0.25);
}

.vintage-textarea {
  height: auto;
  min-height: 54px;
  resize: vertical;
}

/* Sponsor Types Grid */
.sponsor-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 12px;
  background-color: #fff;
  border: 2px solid #1c1b18;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.type-card:hover:not(:disabled) {
  background-color: #f7eee0;
  transform: translateY(-1px);
}

.type-card.active {
  background-color: #d8812a;
  border-color: #1c1b18;
  box-shadow: 2px 2px 0px #1c1b18;
}

.type-icon {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.type-title {
  font-size: 0.86rem;
  font-weight: 900;
  color: #1c1b18;
  letter-spacing: 0.2px;
}

.type-desc {
  font-size: 0.74rem;
  font-weight: 700;
  color: #4e483d;
  line-height: 1.15;
}

.type-card.active .type-desc {
  color: #1c1b18;
}

/* Support Detail Box */
.support-detail-box {
  background: rgba(216, 129, 42, 0.12);
  border: 1.5px solid rgba(216, 129, 42, 0.5);
  border-radius: 6px;
  padding: 10px;
}

.preset-amounts-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.preset-btn {
  padding: 4px 8px;
  font-family: var(--font-condensed);
  font-size: 0.8rem;
  font-weight: 800;
  border: 1.5px solid #1c1b18;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background-color: #f3dfc6;
}

.preset-btn.active {
  background-color: #1c1b18;
  color: #d9822b;
}

/* Logo Upload */
.logo-upload-box {
  display: flex;
  flex-direction: column;
}

.upload-dropzone {
  border: 2px dashed #1c1b18;
  border-radius: 6px;
  padding: 14px 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.upload-dropzone:hover {
  background-color: #fff;
  border-color: #d8812a;
}

.upload-icon {
  font-size: 1.6rem;
  color: #d8812a;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 0.88rem;
  font-weight: 900;
  color: #1c1b18;
}

.upload-sub {
  font-size: 0.74rem;
  font-weight: 700;
  color: #635b50;
}

.hidden-file-input {
  display: none;
}

.logo-preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  border: 2px solid #1c1b18;
  border-radius: 6px;
  padding: 8px 12px;
}

.preview-img-container {
  width: 60px;
  height: 50px;
  background: #f0ede6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1c1b18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.preview-status {
  font-size: 0.75rem;
  font-weight: 700;
  color: #384b28;
}

.remove-logo-btn {
  background: #fce8e8;
  border: 1.5px solid #d93838;
  color: #a01c1c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-logo-btn:hover {
  background: #fad2d2;
}

/* Activations Checkboxes */
.activations-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.5);
  border: 1.5px solid rgba(28, 27, 24, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
}

.activation-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1c1b18;
  cursor: pointer;
}

.vintage-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #d8812a;
  cursor: pointer;
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

.submit-btn {
  margin-top: 6px;
  width: 100%;
  padding: 12px 16px;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Success View */
.success-box {
  text-align: center;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stamp-circle {
  width: 90px;
  height: 90px;
  border: 3px dashed #d9822b;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #1c1b18;
  background: rgba(217, 130, 43, 0.15);
  font-weight: 900;
  margin-bottom: 14px;
  transform: rotate(-6deg);
}

.stamp-circle span {
  font-size: 0.72rem;
  letter-spacing: 0.5px;
}

.stamp-circle i {
  font-size: 1.8rem;
  color: #d9822b;
}

.success-title {
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 8px;
  color: #1c1b18;
}

.success-desc {
  font-size: 0.96rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #4a453e;
  line-height: 1.4;
  max-width: 440px;
}

.success-highlight-card {
  background-color: #fff;
  border: 2px dashed #1c1b18;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: #1c1b18;
  text-align: left;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.whatsapp-btn {
  background-color: #25d366;
  border-color: #1c1b18;
  color: #1c1b18;
  font-size: 1rem;
  padding: 12px;
  box-shadow: 4px 4px 0px #1c1b18;
}

.whatsapp-btn:hover {
  background-color: #1ebd5a;
}

.modal-btn-close {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
}

@media (max-width: 540px) {
  .modal-box {
    padding: 18px 14px 16px;
    max-height: calc(100dvh - 20px);
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sponsor-types-grid {
    grid-template-columns: 1fr;
  }
}
</style>
