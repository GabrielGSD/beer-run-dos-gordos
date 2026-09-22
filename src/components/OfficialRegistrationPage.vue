<template>
  <div class="official-reg-page">
    <!-- Barra Superior de Navegação -->
    <header class="reg-top-bar">
      <div class="container reg-top-content">
        <button class="btn-back-home font-condensed" @click="$emit('go-home')">
          <i class="fa-solid fa-arrow-left"></i>
          <span class="btn-back-desktop">VOLTAR AO SITE</span>
          <span class="btn-back-mobile">VOLTAR</span>
        </button>

        <div class="brand-badge font-condensed">
          <i class="fa-solid fa-beer-mug-empty"></i>
          <span>BEER RUN DOS GORDOS • 1ª EDIÇÃO 2026</span>
        </div>
      </div>
    </header>

    <main class="container reg-main-content">
      <!-- 1. TELA DE SUCESSO / COMPROVANTE APÓS INSCRIÇÃO CONCLUÍDA -->
      <!-- 1. TELA DE SUCESSO / COMPROVANTE / PAGAMENTO APÓS INSCRIÇÃO -->
      <section v-if="submitted && confirmedAthlete" class="confirmation-section">
        <div class="vintage-card checkout-card">
          <!-- Top Header Ribbon -->
          <div class="checkout-header-ribbon">
            <div
              :class="[
                'checkout-status-badge font-condensed',
                confirmedAthlete.paymentStatus === 'completed' ? 'status-completed' : 'status-pending'
              ]"
            >
              <span class="status-pulse-dot"></span>
              <i :class="confirmedAthlete.paymentStatus === 'completed' ? 'fa-solid fa-circle-check' : 'fa-solid fa-clock'"></i>
              <span>{{ confirmedAthlete.paymentStatus === 'completed' ? 'INSCRIÇÃO CONFIRMADA' : 'AGUARDANDO PAGAMENTO' }}</span>
            </div>
            <div class="checkout-ticket-num font-mono">
              <span class="num-lbl font-condensed">INSCRIÇÃO:</span>
              <span class="num-badge">BRG-{{ formattedRegistrationCode }}</span>
            </div>
          </div>

          <!-- Conteúdo Principal do Checkout -->
          <div class="checkout-body">
            <!-- Cabeçalho do Atleta e Prova -->
            <div class="checkout-athlete-summary">
              <span class="checkout-subtitle font-condensed">ATLETA INSCRITO(A)</span>
              <h2 class="checkout-athlete-name font-slab">
                {{ confirmedAthlete.displayName || confirmedAthlete.name }}
              </h2>

              <!-- Chips Essenciais Resumidos -->
              <div class="checkout-chips font-condensed">
                <span class="checkout-chip">
                  <i :class="confirmedAthlete.modality === 'caminhada' ? 'fa-solid fa-person-walking' : 'fa-solid fa-person-running'"></i>
                  {{ confirmedAthlete.modality === 'caminhada' ? 'Caminhada 6.37 KM' : 'Corrida 6.37 KM' }}
                </span>
                <span class="checkout-chip">
                  <i class="fa-solid fa-utensils"></i>
                  {{ confirmedAthlete.skewerChoice || confirmedAthlete.shirtSize || '1 Carne + 1 Frango' }}
                </span>
                <span class="checkout-chip">
                  <i :class="confirmedAthlete.drinksBeer ? 'fa-solid fa-beer-mug-empty' : 'fa-solid fa-bottle-water'"></i>
                  {{ confirmedAthlete.drinksBeer ? 'Chopp Liberado' : 'Apenas Hidratação' }}
                </span>
              </div>
            </div>

            <!-- SEÇÃO DE PAGAMENTO: PENDENTE -->
            <div v-if="confirmedAthlete.paymentStatus !== 'completed'" class="checkout-payment-box">
              <!-- BOX DO VALOR DA INSCRIÇÃO (DESTAQUE MÁXIMO) -->
              <div class="checkout-price-card">
                <div class="price-header">
                  <span class="price-label font-condensed">VALOR DA INSCRIÇÃO</span>
                  <span class="price-batch font-condensed">LOTE ÚNICO</span>
                </div>
                <div class="price-amount-wrap">
                  <span class="price-currency font-slab">R$</span>
                  <span class="price-value font-slab">80</span>
                  <span class="price-cents font-slab">,00</span>
                </div>
                <div class="price-includes-tags font-condensed">
                  <span><i class="fa-solid fa-check"></i> Medalha Finisher Metal</span>
                  <span><i class="fa-solid fa-check"></i> 2 Espetinhos na Chegada</span>
                  <span><i class="fa-solid fa-check"></i> Chopp / Bebida</span>
                  <span><i class="fa-solid fa-check"></i> Hidratação Oficial</span>
                </div>
              </div>

              <!-- BOX DA CHAVE PIX -->
              <div class="checkout-pix-box">
                <div class="pix-title-row font-condensed">
                  <span class="pix-badge"><i class="fa-brands fa-pix"></i> PAGAMENTO VIA PIX</span>
                  <span class="pix-recipient">Favorecido: <strong>Gabriel Daniel</strong> (Comissão)</span>
                </div>

                <div class="pix-copy-container">
                  <div class="pix-key-display">
                    <span class="pix-key-type font-condensed">CHAVE PIX (E-MAIL):</span>
                    <strong class="pix-key-string font-mono">gabriel.souza492@gmail.com</strong>
                  </div>
                  <button
                    type="button"
                    class="btn-copy-pix font-condensed"
                    @click="copyPixKey"
                    :class="{ 'btn-copied': pixKeyCopied }"
                  >
                    <i :class="pixKeyCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
                    <span>{{ pixKeyCopied ? 'CHAVE COPIADA!' : 'COPIAR CHAVE' }}</span>
                  </button>
                </div>

                <p class="pix-instruction-hint font-condensed">
                  <i class="fa-solid fa-circle-info"></i> Transfira <strong>R$ 80,00</strong> no app do seu banco e envie o comprovante no WhatsApp abaixo para confirmação imediata da vaga:
                </p>
              </div>

              <!-- BOTÃO PRINCIPAL: ENVIAR COMPROVANTE -->
              <div class="checkout-cta-zone">
                <a
                  :href="whatsappReceiptUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-vintage btn-whatsapp-checkout font-slab"
                >
                  <i class="fa-brands fa-whatsapp"></i>
                  <span>ENVIAR COMPROVANTE (R$ 80,00)</span>
                </a>
                <p class="cta-note font-condensed">
                  <i class="fa-solid fa-shield-halved"></i> O Staff validará seu pagamento e atualizará o status para <strong>CONCLUÍDO</strong>.
                </p>
              </div>
            </div>

            <!-- SEÇÃO DE PAGAMENTO: JÁ CONFIRMADO / COMPLETED -->
            <div v-else class="checkout-completed-box">
              <div class="completed-badge-icon">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <h3 class="font-slab completed-h3">PAGAMENTO DE R$ 80,00 CONFIRMADO!</h3>
              <p class="font-condensed completed-p">
                Sua vaga e seu kit estão 100% garantidos para o dia <strong>29 de Novembro de 2026</strong> em Natércia/MG. Nos vemos na largada!
              </p>

              <div class="checkout-cta-zone">
                <a
                  :href="whatsappReceiptUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-vintage btn-whatsapp-checkout font-slab"
                >
                  <i class="fa-brands fa-whatsapp"></i>
                  <span>FALAR COM A ORGANIZAÇÃO</span>
                </a>
              </div>
            </div>

            <!-- AÇÕES SECUNDÁRIAS COMPACTAS -->
            <div class="checkout-secondary-actions font-condensed">
              <button type="button" class="btn-sec-link" @click="printReceipt">
                <i class="fa-solid fa-print"></i>
                <span>Imprimir Comprovante</span>
              </button>
              <span class="sec-divider">•</span>
              <button type="button" class="btn-sec-link" @click="$emit('go-home')">
                <i class="fa-solid fa-house"></i>
                <span>Voltar ao Início</span>
              </button>
            </div>
          </div>

          <!-- Rodapé decorativo discreto -->
          <div class="checkout-footer-strip font-condensed">
            <span>BEER RUN DOS GORDOS • NATÉRCIA / MG • 29 NOV 2026 • 08:00</span>
          </div>
        </div>
      </section>

      <!-- 2. CARREGAMENTO / VERIFICAÇÃO AUTOMÁTICA EM ANDAMENTO -->
      <section v-else-if="isAutoVerifying" class="auth-barrier-section">
        <div class="vintage-card auth-card text-center">
          <div class="auth-icon-box">
            <i class="fa-solid fa-spinner fa-spin auth-icon"></i>
          </div>
          <h2 class="auth-title font-slab">VERIFICANDO CONVOCAÇÃO...</h2>
          <p class="auth-subtitle font-condensed">
            Validando sua vaga junto à base de atletas pré-inscritos da Beer Run dos Gordos.
          </p>
        </div>
      </section>

      <!-- 3. BARREIRA DE SEGURANÇA (CASO NÃO TENHA LINK VÁLIDO OU ACESSO DIRETO) -->
      <section v-else-if="!verifiedAthlete" class="auth-barrier-section">
        <div class="vintage-card auth-card">
          <div class="auth-badge font-condensed">
            <i class="fa-solid fa-lock"></i> VAGAS PESSOAIS E INTRANSFERÍVEIS
          </div>

          <div class="auth-header">
            <div class="auth-icon-circle">
              <i class="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h1 class="auth-title font-slab">ÁREA EXCLUSIVA PARA CONVOCADOS</h1>
              <p class="auth-subtitle font-condensed">
                Para evitar repasses indevidos de vagas, a inscrição oficial é restrita aos atletas que já realizaram a pré-inscrição e foram chamados pela comissão.
              </p>
            </div>
          </div>

          <div class="auth-form-box">
            <div v-if="authError" class="auth-error-banner font-condensed">
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>{{ authError }}</span>
            </div>

            <form @submit.prevent="handleManualAuth" class="auth-form">
              <div class="form-group">
                <label class="auth-label font-condensed">
                  INFORME O WHATSAPP CADASTRADO NA PRÉ-INSCRIÇÃO:
                </label>
                <div class="input-with-button">
                  <input
                    type="tel"
                    v-model="manualPhoneInput"
                    @input="formatManualPhone"
                    maxlength="15"
                    required
                    placeholder="(35) 99999-9999"
                    class="vintage-input auth-input font-condensed"
                    :disabled="isVerifying"
                  />
                  <button
                    type="submit"
                    class="btn-vintage btn-auth font-slab"
                    :disabled="isVerifying"
                  >
                    <i v-if="isVerifying" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-key"></i>
                    <span>{{ isVerifying ? 'VERIFICANDO...' : 'LIBERAR INSCRIÇÃO' }}</span>
                  </button>
                </div>
              </div>
            </form>

            <div class="auth-footer-help font-condensed">
              <span>Ainda não realizou sua pré-inscrição ou está na lista de espera?</span>
              <div class="auth-help-actions">
                <button class="link-btn" @click="$emit('go-home')">
                  ← Acessar Página Inicial
                </button>
                <a
                  href="https://wa.me/5535997500430?text=Olá,%20gostaria%20de%20saber%20sobre%20minha%20vaga%20na%20Beer%20Run%20dos%20Gordos!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link-btn wa-help"
                >
                  <i class="fa-brands fa-whatsapp"></i> Falar com a Organização
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. TELA INICIAL ISOLADA: APENAS O PRIMEIRO CARD DE CONVOCAÇÃO -->
      <section v-else-if="!hasStartedWizard" class="welcome-card-section">
        <div class="vintage-card welcome-athlete-card">
          <!-- Cabeçalho do Card -->
          <div class="welcome-header">
            <div class="welcome-shield-circle">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <span class="welcome-tag font-condensed">★ ATLETA CONVOCADO(A) E AUTENTICADO(A) ★</span>
            <h1 class="welcome-name font-slab">{{ verifiedAthlete.displayName || verifiedAthlete.name }}</h1>
            
            <div class="welcome-phone font-condensed">
              <i class="fa-solid fa-lock"></i> WhatsApp: <strong>{{ verifiedAthlete.phone }}</strong>
              <span class="lock-pill"><i class="fa-solid fa-shield"></i> Vaga Intransferível</span>
            </div>
          </div>

          <div class="welcome-divider"></div>

          <!-- Mensagem e Instruções -->
          <div class="welcome-body font-condensed">
            <p class="welcome-lead">
              Sua vaga para a <strong>1ª Edição da Beer Run dos Gordos (29 de Novembro de 2026)</strong> está liberada! Seus dados de pré-inscrição já foram importados com sucesso.
            </p>
            <p class="welcome-instruction">
              Para oficializar sua participação na prova (número de peito, medalha, chopp e churrasco de chegada), complete as <strong>4 etapas rápidas</strong> abaixo:
            </p>

            <!-- Preview Visual das 4 Etapas -->
            <div class="welcome-steps-preview">
              <div class="preview-step-item" :class="{ 'preview-active': savedDraftStep === 1, 'preview-done': savedDraftStep > 1 }">
                <span class="preview-num">
                  <i v-if="savedDraftStep > 1" class="fa-solid fa-check"></i>
                  <span v-else>1</span>
                </span>
                <div class="preview-text">
                  <strong>1. Identificação</strong>
                  <span>CPF, data de nascimento e cidade</span>
                </div>
              </div>

              <div class="preview-step-item" :class="{ 'preview-active': savedDraftStep === 2, 'preview-done': savedDraftStep > 2 }">
                <span class="preview-num">
                  <i v-if="savedDraftStep > 2" class="fa-solid fa-check"></i>
                  <span v-else>2</span>
                </span>
                <div class="preview-text">
                  <strong>2. Emergência</strong>
                  <span>Contato de apoio e saúde</span>
                </div>
              </div>

              <div class="preview-step-item" :class="{ 'preview-active': savedDraftStep === 3, 'preview-done': savedDraftStep > 3 }">
                <span class="preview-num">
                  <i v-if="savedDraftStep > 3" class="fa-solid fa-check"></i>
                  <span v-else>3</span>
                </span>
                <div class="preview-text">
                  <strong>3. Espetinhos & Chopp</strong>
                  <span>Modalidade, 2 espetinhos e chopp</span>
                </div>
              </div>

              <div class="preview-step-item" :class="{ 'preview-active': savedDraftStep === 4, 'preview-done': savedDraftStep > 4 }">
                <span class="preview-num">
                  <i v-if="savedDraftStep > 4" class="fa-solid fa-check"></i>
                  <span v-else>4</span>
                </span>
                <div class="preview-text">
                  <strong>4. Regulamento</strong>
                  <span>Termos da prova e dados do PIX</span>
                </div>
              </div>
            </div>

            <!-- Aviso se houver rascunho recuperado -->
            <div v-if="hasSavedDraft" class="draft-resume-box">
              <div class="draft-resume-icon">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div class="draft-resume-info">
                <strong>PROGRESSO ANTERIOR RECUPERADO!</strong>
                <span>Você já iniciou o preenchimento e parou na <strong>Etapa {{ savedDraftStep }} ({{ steps[savedDraftStep - 1]?.label || 'Identificação' }})</strong>. Seus dados continuam salvos e você pode continuar exatamente de onde parou.</span>
              </div>
            </div>
          </div>

          <!-- Ação Principal: Botão Começar / Continuar -->
          <div class="welcome-actions">
            <button
              type="button"
              class="btn-vintage btn-start-wizard font-slab"
              @click="startWizard(savedDraftStep)"
            >
              <i v-if="hasSavedDraft" class="fa-solid fa-play"></i>
              <i v-else class="fa-solid fa-flag-checkered"></i>
              <span>{{ hasSavedDraft ? `CONTINUAR INSCRIÇÃO (ETAPA ${savedDraftStep} DE 4)` : 'COMEÇAR INSCRIÇÃO' }}</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>

            <button
              v-if="hasSavedDraft && savedDraftStep > 1"
              type="button"
              class="btn-restart-draft font-condensed"
              @click="startWizard(1)"
            >
              <i class="fa-solid fa-rotate-left"></i> Começar da Etapa 1 (Identificação)
            </button>
          </div>

          <div class="welcome-footer-guarantee font-condensed">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Seu progresso é gravado automaticamente a cada etapa para você não perder nenhum dado.</span>
          </div>
        </div>
      </section>

      <!-- 5. FORMULÁRIO DESBLOQUEADO EM ETAPAS (WIZARD: EXIBIDO APÓS CLICAR EM COMEÇAR) -->
      <div v-else class="reg-container">
        <!-- Barra de Identificação Rápida do Atleta (2 Linhas Alinhadas) -->
        <div class="athlete-mini-bar font-condensed">
          <!-- Linha 1: Nome do Atleta e Selo de Convocação -->
          <div class="mini-bar-top">
            <div class="mini-bar-name-wrap">
              <i class="fa-solid fa-circle-check text-green"></i>
              <span class="mini-bar-name font-slab">{{ verifiedAthlete.displayName || verifiedAthlete.name }}</span>
            </div>
            <span class="mini-bar-badge font-condensed">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Vaga Confirmada</span>
            </span>
          </div>

          <!-- Linha 2: Telefone Vinculado e Ação para Ver Convocação -->
          <div class="mini-bar-bottom">
            <div class="mini-bar-phone-wrap">
              <span class="mini-bar-phone">
                <i class="fa-solid fa-lock"></i>
                <span class="phone-label">WhatsApp:</span>
                <strong>{{ verifiedAthlete.phone }}</strong>
              </span>
            </div>
            <button
              type="button"
              class="btn-mini-back font-condensed"
              @click="backToWelcome"
              title="Voltar ao resumo da convocação"
            >
              <i class="fa-solid fa-id-card"></i>
              <span>Ver Convocação</span>
            </button>
          </div>
        </div>

        <!-- Barra de Progresso / Stepper Visual (Apenas Números) -->
        <div class="wizard-stepper font-condensed" role="tablist" aria-label="Etapas da inscrição">
          <button
            type="button"
            v-for="(stepInfo, index) in steps"
            :key="index"
            :class="['step-tab', { active: currentStep === index + 1, completed: currentStep > index + 1 }]"
            @click="canNavigateTo(index + 1) && goToStep(index + 1)"
            :disabled="!canNavigateTo(index + 1)"
            :title="`Etapa ${index + 1}: ${stepInfo.label}`"
            :aria-label="`Etapa ${index + 1}: ${stepInfo.label}`"
          >
            <span class="step-badge">
              <i v-if="currentStep > index + 1" class="fa-solid fa-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </span>
          </button>
        </div>

        <!-- Formulário Oficial Multi-Etapas -->
        <form @submit.prevent="handleSubmit" class="reg-form" novalidate>
          <div v-if="stepError" class="error-banner font-condensed">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ stepError }}</span>
          </div>

          <!-- TELA 1: IDENTIFICAÇÃO DO ATLETA -->
          <transition name="step-fade" mode="out-in">
            <div v-if="currentStep === 1" key="step1" class="form-section-card step-card" role="region" aria-label="Dados Pessoais do Atleta">
              <div class="step-header">
                <h2 class="section-title font-slab">
                  <span class="step-num font-condensed">1</span> DADOS PESSOAIS DO ATLETA
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 1 de 4 • Confirme sua identificação para o número de peito e classificação
                </p>
              </div>

              <div class="form-grid">
                <!-- NOME COMPLETO (BLOQUEADO / READONLY) -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    NOME COMPLETO *
                    <span class="locked-hint">
                      <i class="fa-solid fa-lock"></i> Nome oficial da pré-inscrição (vaga intransferível)
                    </span>
                  </label>
                  <div class="input-locked-wrapper">
                    <input
                      type="text"
                      :value="form.name"
                      readonly
                      class="vintage-input font-condensed input-locked"
                      title="O nome não pode ser alterado pois está vinculado à sua convocação oficial."
                    />
                    <span class="lock-indicator" title="Campo bloqueado">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed ">
                    APELIDO / NOME DE GUERRA
                  </label>
                  <input
                    type="text"
                    v-model="form.nickname"
                    placeholder="Ex: Mestre Cervejeiro, Gordo Raiz..."
                    class="vintage-input font-condensed"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    CPF *
                    <span class="field-desc">(para identificação e seguro atleta)</span>
                  </label>
                  <input
                    type="text"
                    v-model="form.cpf"
                    @input="formatCpf"
                    maxlength="14"
                    required
                    placeholder="000.000.000-00"
                    class="vintage-input font-condensed"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    DATA DE NASCIMENTO *
                  </label>
                  <input
                    type="date"
                    v-model="form.birthDate"
                    @change="handleBirthDateChange"
                    required
                    class="vintage-input font-condensed"
                  />
                  <span v-if="athleteAge !== null" class="age-badge font-condensed">
                    Idade na prova: <strong>{{ athleteAge }} anos</strong>
                    <span v-if="athleteAge < 18" class="text-warning"> (Menor de 18 anos - Proibido consumo de chopp)</span>
                  </span>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    SEXO / GÊNERO *
                  </label>
                  <div class="toggle-options-row font-condensed">
                    <button
                      type="button"
                      :class="['toggle-pill', { active: form.gender === 'M' }]"
                      @click="form.gender = 'M'"
                    >
                      <i class="fa-solid fa-mars"></i> MASCULINO
                    </button>
                    <button
                      type="button"
                      :class="['toggle-pill', { active: form.gender === 'F' }]"
                      @click="form.gender = 'F'"
                    >
                      <i class="fa-solid fa-venus"></i> FEMININO
                    </button>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    CIDADE E ESTADO *
                  </label>
                  <input
                    type="text"
                    v-model="form.cityState"
                    placeholder="Ex: Natércia/MG, Pouso Alegre/MG, São Paulo/SP..."
                    class="vintage-input font-condensed"
                  />
                </div>
              </div>

              <!-- Botão da Etapa 1 -->
              <div class="step-footer-actions">
                <button
                  type="button"
                  class="btn-vintage btn-step-back font-slab"
                  @click="backToWelcome"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                  <span class="btn-text-desktop">CONVOCAÇÃO</span>
                  <span class="btn-text-mobile">VOLTAR</span>
                </button>
                <button
                  type="button"
                  class="btn-vintage btn-step-next font-slab"
                  @click="goToNextStep"
                >
                  <span class="btn-text-desktop">CONTINUAR PARA CONTATO & EMERGÊNCIA</span>
                  <span class="btn-text-mobile">AVANÇAR</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- TELA 2: CONTATO E EMERGÊNCIA -->
            <div v-else-if="currentStep === 2" key="step2" class="form-section-card step-card" role="region" aria-label="Contato e Emergência">
              <div class="step-header">
                <h2 class="section-title font-slab">
                  <span class="step-num font-condensed">2</span> CONTATO & EMERGÊNCIA
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 2 de 4 • Dados de segurança obrigatórios para atendimento no percurso rural
                </p>
              </div>

              <div class="form-grid">
                <!-- CELULAR / WHATSAPP (BLOQUEADO / READONLY) -->
                <div class="form-group">
                  <label class="form-label font-condensed">
                    CELULAR / WHATSAPP *
                    <span class="locked-hint">
                      <i class="fa-solid fa-lock"></i> Número vinculado (não editável)
                    </span>
                  </label>
                  <div class="input-locked-wrapper">
                    <input
                      type="tel"
                      :value="form.phone"
                      readonly
                      class="vintage-input font-condensed input-locked"
                    />
                    <span class="lock-indicator" title="Número autenticado">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    NOME DO CONTATO DE EMERGÊNCIA *
                    <span class="field-desc">(familiar ou amigo para sobreaviso)</span>
                  </label>
                  <input
                    type="text"
                    v-model="form.emergencyContactName"
                    required
                    placeholder="Ex: Maria Silva (Esposa / Irmão / Amigo)"
                    class="vintage-input font-condensed"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    TELEFONE DO CONTATO DE EMERGÊNCIA *
                  </label>
                  <input
                    type="tel"
                    v-model="form.emergencyContactPhone"
                    @input="formatEmergencyPhone"
                    maxlength="15"
                    required
                    placeholder="(35) 99999-9999"
                    class="vintage-input font-condensed"
                  />
                </div>

                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    OBSERVAÇÕES MÉDICAS OU ALERGIAS
                    <span class="optional-tag">(OPCIONAL)</span>
                  </label>
                  <input
                    type="text"
                    v-model="form.medicalNotes"
                    placeholder="Ex: Alergia a picada de insetos, medicamentos contínuos, intolerâncias..."
                    class="vintage-input font-condensed"
                  />
                </div>
              </div>

              <!-- Botões da Etapa 2 -->
              <div class="step-footer-actions">
                <button
                  type="button"
                  class="btn-vintage btn-step-back font-slab"
                  @click="goToPrevStep"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                  <span>VOLTAR</span>
                </button>
                <button
                  type="button"
                  class="btn-vintage btn-step-next font-slab"
                  @click="goToNextStep"
                >
                  <span class="btn-text-desktop">CONTINUAR PARA ESPETINHOS & CHOPP</span>
                  <span class="btn-text-mobile">AVANÇAR</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- TELA 3: MODALIDADE & CONFRATERNIZAÇÃO -->
            <div v-else-if="currentStep === 3" key="step3" class="form-section-card step-card" role="region" aria-label="Modalidade e Confraternização do Atleta">
              <div class="step-header">
                <h2 class="section-title font-slab">
                  <span class="step-num font-condensed">3</span> MODALIDADE & BRINDES
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 3 de 4 • Selecione sua modalidade, opção de espetinhos e hidratação
                </p>
              </div>

              <div class="form-grid">
                <!-- MODALIDADE (2 COLUNAS LADO A LADO) -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">MODALIDADE NA PROVA *</label>
                  <div class="choice-cards-row font-condensed">
                    <label :class="['choice-card', { selected: form.modality === 'corrida' }]">
                      <input
                        type="radio"
                        v-model="form.modality"
                        value="corrida"
                        class="sr-only"
                      />
                      <div class="choice-icon">🏃‍♂️</div>
                      <div class="choice-text">
                        <strong>CORRIDA</strong>
                        <span>6,37 km livre</span>
                      </div>
                    </label>

                    <label :class="['choice-card', { selected: form.modality === 'caminhada' }]">
                      <input
                        type="radio"
                        v-model="form.modality"
                        value="caminhada"
                        class="sr-only"
                      />
                      <div class="choice-icon">🚶‍♂️</div>
                      <div class="choice-text">
                        <strong>CAMINHADA</strong>
                        <span>6,37 km sem pressa</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- CHOPP (2 COLUNAS LADO A LADO) -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    CONSUMO DE CHOPP ARTESANAL? 🍺 *
                    <span class="field-desc">(Artigo 6.3: Facultativo e restrito a +18)</span>
                  </label>
                  <div class="choice-cards-row font-condensed">
                    <label :class="['choice-card', { selected: form.drinksBeer === true }]">
                      <input
                        type="radio"
                        :checked="form.drinksBeer === true"
                        @change="form.drinksBeer = true"
                        class="sr-only"
                      />
                      <div class="choice-icon">🍺</div>
                      <div class="choice-text">
                        <strong>QUERO CHOPP!</strong>
                        <span>Liberado na prova</span>
                      </div>
                    </label>

                    <label :class="['choice-card', { selected: form.drinksBeer === false }]">
                      <input
                        type="radio"
                        :checked="form.drinksBeer === false"
                        @change="form.drinksBeer = false"
                        class="sr-only"
                      />
                      <div class="choice-icon">💧</div>
                      <div class="choice-text">
                        <strong>SEM ÁLCOOL</strong>
                        <span>Água e refrigerante</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- ESPETINHOS DA CHEGADA COM STEPPERS (+ / -) E VEGETARIANO -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    CHURRASCO DE CHEGADA: 2 ESPETINHOS 🍢 *
                    <span class="field-desc">(Defina a combinação dos seus 2 espetinhos de chegada)</span>
                  </label>
                  
                  <div class="skewer-box">
                    <div class="skewer-rows-list">
                      <!-- Linha 1: Carne -->
                      <div class="skewer-row-item" :class="{ 'is-disabled': skewerIsVegetarian }">
                        <div class="skewer-item-label">
                          <span class="skewer-icon">🥩</span>
                          <div class="skewer-item-names">
                            <strong>Carne</strong>
                            <small>Espetinho bovino</small>
                          </div>
                        </div>
                        <div class="stepper-actions">
                          <button
                            type="button"
                            class="btn-stepper font-slab"
                            :disabled="skewerCarne <= 0 || skewerIsVegetarian"
                            @click="decrementCarne"
                            title="Diminuir espetinho de carne"
                            aria-label="Diminuir carne"
                          >
                            <i class="fa-solid fa-minus"></i>
                          </button>
                          <span class="stepper-count font-slab">{{ skewerIsVegetarian ? 0 : skewerCarne }}</span>
                          <button
                            type="button"
                            class="btn-stepper font-slab"
                            :disabled="skewerCarne >= 2 || skewerIsVegetarian"
                            @click="incrementCarne"
                            title="Aumentar espetinho de carne"
                            aria-label="Aumentar carne"
                          >
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Linha 2: Frango -->
                      <div class="skewer-row-item" :class="{ 'is-disabled': skewerIsVegetarian }">
                        <div class="skewer-item-label">
                          <span class="skewer-icon">🍗</span>
                          <div class="skewer-item-names">
                            <strong>Frango</strong>
                            <small>Espetinho temperado</small>
                          </div>
                        </div>
                        <div class="stepper-actions">
                          <button
                            type="button"
                            class="btn-stepper font-slab"
                            :disabled="skewerFrango <= 0 || skewerIsVegetarian"
                            @click="decrementFrango"
                            title="Diminuir espetinho de frango"
                            aria-label="Diminuir frango"
                          >
                            <i class="fa-solid fa-minus"></i>
                          </button>
                          <span class="stepper-count font-slab">{{ skewerIsVegetarian ? 0 : skewerFrango }}</span>
                          <button
                            type="button"
                            class="btn-stepper font-slab"
                            :disabled="skewerFrango >= 2 || skewerIsVegetarian"
                            @click="incrementFrango"
                            title="Aumentar espetinho de frango"
                            aria-label="Aumentar frango"
                          >
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Linha 3: Vegetariano -->
                      <label class="skewer-row-item skewer-row-veg" :class="{ active: skewerIsVegetarian }">
                        <input
                          type="checkbox"
                          :checked="skewerIsVegetarian"
                          @change="toggleVegetarian"
                          class="sr-only"
                        />
                        <div class="skewer-item-label">
                          <span class="skewer-icon">🌱</span>
                          <div class="skewer-item-names">
                            <strong>Vegetariano</strong>
                            <small>Não consumo carne / refeição sem carne</small>
                          </div>
                        </div>
                        <div class="veg-toggle-action">
                          <span class="veg-switch" :class="{ checked: skewerIsVegetarian }">
                            <i v-if="skewerIsVegetarian" class="fa-solid fa-check"></i>
                          </span>
                        </div>
                      </label>
                    </div>

                    <!-- Resumo inline sutil -->
                    <div class="skewer-summary-bar font-condensed">
                      <span v-if="skewerIsVegetarian" class="text-veg">
                        <i class="fa-solid fa-seedling"></i> Opção Vegetariana confirmada (sem carne)
                      </span>
                      <span v-else class="text-standard">
                        <i class="fa-solid fa-utensils"></i> Seleção: <strong>{{ formatSkewerLabel(form.skewerChoice) }}</strong> (2 espetinhos inclusos)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botões da Etapa 3 -->
              <div class="step-footer-actions">
                <button
                  type="button"
                  class="btn-vintage btn-step-back font-slab"
                  @click="goToPrevStep"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                  <span>VOLTAR</span>
                </button>
                <button
                  type="button"
                  class="btn-vintage btn-step-next font-slab"
                  @click="goToNextStep"
                >
                  <span class="btn-text-desktop">AVANÇAR PARA O REGULAMENTO</span>
                  <span class="btn-text-mobile">AVANÇAR</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- TELA 4: REGULAMENTO OFICIAL E ACEITE DOS TERMOS -->
            <div v-else-if="currentStep === 4" key="step4" class="form-section-card step-card regulation-card" role="region" aria-label="Regulamento e Aceite dos Termos">
              <div class="step-header">
                <h2 class="section-title font-slab">
                  <span class="step-num font-condensed">4</span> REGULAMENTO & ACEITE
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 4 de 4 • Leia o regulamento oficial e confirme sua participação na prova
                </p>
              </div>

              <p class="reg-intro-text font-condensed">
                Antes de finalizar a sua inscrição, é fundamental ler os termos do regulamento da prova. Ele foi construído para assegurar a diversão, a transparência e a segurança de todos os atletas no percurso rural.
              </p>

              <!-- Cards Resumo das Regras Principais -->
              <div class="rules-summary-grid font-condensed">
                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-medal"></i></div>
                  <div>
                    <strong>Espírito da Prova</strong>
                    <p>Recreativa, festiva e beneficente em prol do Natal Solidário dos Gordos.</p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-stopwatch"></i></div>
                  <div>
                    <strong>Sem Chip Eletrônico</strong>
                    <p>Premiação simbólica apenas aos 3 primeiros gerais masc e fem por ordem de chegada.</p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-road"></i></div>
                  <div>
                    <strong>Percurso Rural</strong>
                    <p>6,37 km com terra, subidas e descidas no Sítio dos Gordos em Natércia/MG.</p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-beer-mug-empty"></i></div>
                  <div>
                    <strong>Chopp Consciente</strong>
                    <p>Consumo facultativo, proibido para menores de 18 anos. Se beber, não dirija.</p>
                  </div>
                </div>
              </div>

              <!-- PDF Viewer & Download Actions -->
              <div class="pdf-viewer-container">
                <div class="pdf-viewer-toolbar font-condensed">
                  <div class="pdf-info">
                    <i class="fa-solid fa-file-pdf text-red"></i>
                    <span><strong>REGULAMENTO DA PROVA • 1ª EDIÇÃO 2026</strong> (Documento Oficial Completo)</span>
                  </div>

                  <div class="pdf-actions">
                    <a
                      href="/regulamento-beer-run-2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn-pdf-action font-condensed"
                    >
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> ABRIR EM NOVA GUIA
                    </a>
                    <a
                      href="/regulamento-beer-run-2026.pdf"
                      download="Regulamento-Beer-Run-dos-Gordos-2026.pdf"
                      class="btn-pdf-action font-condensed highlight"
                    >
                      <i class="fa-solid fa-download"></i> BAIXAR PDF
                    </a>
                  </div>
                </div>

                <!-- Embedded Frame / Document Preview -->
                <div class="pdf-embed-wrapper">
                  <iframe
                    src="/regulamento-beer-run-2026.pdf#toolbar=1&navpanes=0"
                    class="pdf-iframe"
                    title="Regulamento Oficial da Beer Run dos Gordos"
                  ></iframe>
                </div>
                <p class="pdf-hint font-condensed">
                  * Utilize os botões acima para baixar o arquivo completo em PDF ou abrir em tela cheia no celular.
                </p>
              </div>

              <!-- Checkbox de Aceite Obrigatório -->
              <div class="terms-acceptance-box">
                <label class="terms-checkbox-label font-condensed">
                  <input
                    type="checkbox"
                    v-model="form.acceptedTerms"
                    required
                    class="vintage-checkbox"
                    :disabled="isSubmitting"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="terms-text">
                    <strong>LI E CONCORDO COM O REGULAMENTO OFICIAL:</strong> Declaro que li integralmente e concordo com todos os termos do Regulamento da Beer Run dos Gordos 2026. Atesto que possuo aptidão física para a realização do percurso rural de 6,37 km, isentando a organização de responsabilidades decorrentes de condições clínicas prévias, e autorizo expressamente o uso da minha imagem em fotografias e filmagens oficiais para divulgação do evento e das ações do Natal Solidário dos Gordos.
                  </span>
                </label>
              </div>

              <!-- Botões da Etapa 4 (Finalização) -->
              <div class="step-footer-actions final-actions">
                <button
                  type="button"
                  class="btn-vintage btn-step-back font-slab"
                  @click="goToPrevStep"
                  :disabled="isSubmitting"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                  <span>VOLTAR</span>
                </button>
                <button
                  type="submit"
                  class="btn-vintage btn-submit-registration font-slab"
                  :disabled="isSubmitting || !form.acceptedTerms"
                >
                  <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-check-double"></i>
                  <span class="btn-text-desktop">{{ isSubmitting ? 'PROCESSANDO INSCRIÇÃO...' : 'CONFIRMAR INSCRIÇÃO OFICIAL' }}</span>
                  <span class="btn-text-mobile">{{ isSubmitting ? 'PROCESSANDO...' : 'CONFIRMAR INSCRIÇÃO' }}</span>
                </button>
              </div>

              <p class="submit-guarantee font-condensed mt-3 text-center" style="margin-top: 15px">
                <i class="fa-solid fa-lock"></i> Seus dados estão protegidos e serão utilizados exclusivamente para os procedimentos da prova.
              </p>
            </div>
          </transition>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAthletes } from '../composables/useAthletes.js'
import { trackEvent } from '../services/analytics.js'

const emit = defineEmits(['go-home'])

const {
  registerOfficialAthlete,
  findAthleteByPhone,
  saveAthleteDraft,
  loadAthleteDraft,
  clearAthleteDraft
} = useAthletes()

const isAutoVerifying = ref(false)
const isVerifying = ref(false)
const verifiedAthlete = ref(null)
const manualPhoneInput = ref('')
const authError = ref('')

// Controle da Tela Inicial (Card 1) e Stepper Wizard
const hasStartedWizard = ref(false)
const savedDraftStep = ref(1)
const hasSavedDraft = ref(false)

const currentStep = ref(1)
const stepError = ref('')

const isSubmitting = ref(false)
const submitted = ref(false)
const submitError = ref('')
const athleteAge = ref(null)
const confirmedAthlete = ref(null)

const VALID_SKEWER_CHOICES = ['1 Carne + 1 Frango', '2 Carne', '2 Frango', 'Vegetariano']

const skewerCarne = ref(1)
const skewerFrango = ref(1)
const skewerIsVegetarian = ref(false)

function formatSkewerLabel(val) {
  if (val === '1 Carne + 1 Frango') return '1 Carne + 1 Frango (1 de cada)'
  if (val === '2 Carne') return '2 Espetinhos de Carne'
  if (val === '2 Frango') return '2 Espetinhos de Frango'
  if (val === 'Vegetariano') return 'Vegetariano / Sem Carne'
  return val || '1 Carne + 1 Frango (1 de cada)'
}

function resolveValidSkewer(val) {
  if (val && VALID_SKEWER_CHOICES.includes(val)) return val
  return '1 Carne + 1 Frango'
}

function updateSkewerChoice() {
  if (skewerIsVegetarian.value) {
    form.skewerChoice = 'Vegetariano'
    form.shirtSize = 'Vegetariano'
  } else if (skewerCarne.value === 1 && skewerFrango.value === 1) {
    form.skewerChoice = '1 Carne + 1 Frango'
    form.shirtSize = '1 Carne + 1 Frango'
  } else if (skewerCarne.value === 2) {
    form.skewerChoice = '2 Carne'
    form.shirtSize = '2 Carne'
  } else if (skewerFrango.value === 2) {
    form.skewerChoice = '2 Frango'
    form.shirtSize = '2 Frango'
  } else {
    form.skewerChoice = '1 Carne + 1 Frango'
    form.shirtSize = '1 Carne + 1 Frango'
  }
  persistDraft()
}

function incrementCarne() {
  if (skewerIsVegetarian.value) skewerIsVegetarian.value = false
  if (skewerCarne.value < 2) {
    skewerCarne.value++
    skewerFrango.value = 2 - skewerCarne.value
  }
  updateSkewerChoice()
}

function decrementCarne() {
  if (skewerCarne.value > 0) {
    skewerCarne.value--
    skewerFrango.value = 2 - skewerCarne.value
  }
  updateSkewerChoice()
}

function incrementFrango() {
  if (skewerIsVegetarian.value) skewerIsVegetarian.value = false
  if (skewerFrango.value < 2) {
    skewerFrango.value++
    skewerCarne.value = 2 - skewerFrango.value
  }
  updateSkewerChoice()
}

function decrementFrango() {
  if (skewerFrango.value > 0) {
    skewerFrango.value--
    skewerCarne.value = 2 - skewerFrango.value
  }
  updateSkewerChoice()
}

function toggleVegetarian() {
  skewerIsVegetarian.value = !skewerIsVegetarian.value
  if (skewerIsVegetarian.value) {
    skewerCarne.value = 0
    skewerFrango.value = 0
  } else {
    skewerCarne.value = 1
    skewerFrango.value = 1
  }
  updateSkewerChoice()
}

function syncSkewersFromChoice(choice) {
  if (choice === 'Vegetariano') {
    skewerIsVegetarian.value = true
    skewerCarne.value = 0
    skewerFrango.value = 0
  } else if (choice === '2 Carne') {
    skewerIsVegetarian.value = false
    skewerCarne.value = 2
    skewerFrango.value = 0
  } else if (choice === '2 Frango') {
    skewerIsVegetarian.value = false
    skewerCarne.value = 0
    skewerFrango.value = 2
  } else {
    skewerIsVegetarian.value = false
    skewerCarne.value = 1
    skewerFrango.value = 1
  }
}

const form = reactive({
  name: '',
  nickname: '',
  cpf: '',
  birthDate: '',
  gender: 'M',
  cityState: '',
  phone: '',
  email: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
  modality: 'corrida',
  drinksBeer: true,
  skewerChoice: '1 Carne + 1 Frango',
  shirtSize: '1 Carne + 1 Frango',
  acceptedTerms: false
})

const steps = [
  { step: 1, label: '1. Identificação' },
  { step: 2, label: '2. Emergência' },
  { step: 3, label: '3. Espetinhos & Chopp' },
  { step: 4, label: '4. Regulamento' }
]

let draftDebounceTimer = null

// Persistência contínua: salva localmente no localStorage e de forma parcial no Supabase
async function persistDraft(immediate = false) {
  if (!verifiedAthlete.value) return

  const doSave = async () => {
    try {
      const phone = verifiedAthlete.value.phone
      const athleteId = verifiedAthlete.value.id
      const draftData = {
        currentStep: currentStep.value,
        hasStartedWizard: hasStartedWizard.value,
        form: { ...form },
        updatedAt: new Date().toISOString()
      }
      hasSavedDraft.value = true
      savedDraftStep.value = currentStep.value
      await saveAthleteDraft(athleteId, phone, draftData)
    } catch (e) {
      console.warn('Erro ao salvar rascunho:', e)
    }
  }

  if (immediate) {
    if (draftDebounceTimer) clearTimeout(draftDebounceTimer)
    await doSave()
  } else {
    if (draftDebounceTimer) clearTimeout(draftDebounceTimer)
    draftDebounceTimer = setTimeout(doSave, 600)
  }
}

// Salva alterações parciais digitadas com debounce suave
watch(
  form,
  () => {
    if (verifiedAthlete.value && hasStartedWizard.value) {
      persistDraft(false)
    }
  },
  { deep: true }
)

function startWizard(stepOverride) {
  stepError.value = ''
  const target = typeof stepOverride === 'number' && stepOverride >= 1 && stepOverride <= 4
    ? stepOverride
    : (savedDraftStep.value || 1)
  currentStep.value = target
  hasStartedWizard.value = true
  persistDraft(true)
  scrollToCard()
}

function backToWelcome() {
  stepError.value = ''
  hasStartedWizard.value = false
  savedDraftStep.value = currentStep.value
  hasSavedDraft.value = true
  persistDraft(true)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function canNavigateTo(targetStep) {
  return targetStep <= currentStep.value || targetStep <= savedDraftStep.value
}

function goToStep(targetStep) {
  stepError.value = ''
  currentStep.value = targetStep
  persistDraft(true)
  scrollToCard()
}

function scrollToCard() {
  const card = document.querySelector('.step-card')
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    window.scrollTo({ top: 100, behavior: 'smooth' })
  }
}

function validateStep1() {
  if (!form.name || !form.name.trim()) {
    stepError.value = 'Nome do atleta não identificado. Por favor, autentique seu WhatsApp.'
    return false
  }
  const cleanCpf = (form.cpf || '').replace(/\D/g, '')
  if (cleanCpf.length !== 11) {
    stepError.value = 'Por favor, informe um CPF válido com 11 dígitos para continuar.'
    return false
  }
  if (!form.birthDate) {
    stepError.value = 'Por favor, informe sua data de nascimento para cálculo da categoria e idade.'
    return false
  }
  if (!form.gender) {
    stepError.value = 'Por favor, selecione seu sexo/gênero para a classificação da premiação geral.'
    return false
  }
  if (!form.cityState || !form.cityState.trim()) {
    stepError.value = 'Por favor, informe sua cidade e estado de residência.'
    return false
  }
  return true
}

function validateStep2() {
  if (!form.phone || (form.phone || '').replace(/\D/g, '').length < 10) {
    stepError.value = 'Número de WhatsApp inválido ou não autenticado.'
    return false
  }
  if (!form.emergencyContactName || !form.emergencyContactName.trim()) {
    stepError.value = 'Por favor, informe o nome do contato de emergência (Artigo 7 do Regulamento).'
    return false
  }
  const cleanEmergPhone = (form.emergencyContactPhone || '').replace(/\D/g, '')
  if (cleanEmergPhone.length < 10) {
    stepError.value = 'Por favor, informe o telefone/WhatsApp do contato de emergência com DDD.'
    return false
  }
  return true
}

function validateStep3() {
  if (!form.modality) {
    stepError.value = 'Por favor, selecione a modalidade desejada (Corrida ou Caminhada).'
    return false
  }
  if (!form.skewerChoice) {
    stepError.value = 'Por favor, selecione sua preferência para os 2 espetinhos da chegada.'
    return false
  }
  return true
}

function goToNextStep() {
  stepError.value = ''
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    currentStep.value = 2
    if (currentStep.value > savedDraftStep.value) savedDraftStep.value = 2
    persistDraft(true)
    scrollToCard()
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return
    currentStep.value = 3
    if (currentStep.value > savedDraftStep.value) savedDraftStep.value = 3
    persistDraft(true)
    scrollToCard()
  } else if (currentStep.value === 3) {
    if (!validateStep3()) return
    currentStep.value = 4
    if (currentStep.value > savedDraftStep.value) savedDraftStep.value = 4
    persistDraft(true)
    scrollToCard()
  }
}

function goToPrevStep() {
  stepError.value = ''
  if (currentStep.value > 1) {
    currentStep.value--
    persistDraft(true)
    scrollToCard()
  }
}

function applyVerifiedAthlete(athlete) {
  verifiedAthlete.value = athlete

  // 1. Preenche dados herdados da pré-inscrição e do banco
  form.name = athlete.name
  form.nickname = athlete.nickname || ''
  form.phone = athlete.phone
  form.modality = athlete.modality || 'corrida'
  form.drinksBeer = athlete.drinksBeer !== false

  if (athlete.cpf) form.cpf = athlete.cpf
  if (athlete.birthDate) {
    form.birthDate = athlete.birthDate
    handleBirthDateChange()
  }
  if (athlete.gender) form.gender = athlete.gender
  if (athlete.cityState) form.cityState = athlete.cityState
  if (athlete.email) form.email = athlete.email
  if (athlete.emergencyContactName) form.emergencyContactName = athlete.emergencyContactName
  if (athlete.emergencyContactPhone) form.emergencyContactPhone = athlete.emergencyContactPhone
  const athleteSkewer = resolveValidSkewer(athlete.skewerChoice || athlete.shirtSize)
  form.skewerChoice = athleteSkewer
  form.shirtSize = athleteSkewer
  syncSkewersFromChoice(athleteSkewer)
  if (athlete.medicalNotes) form.medicalNotes = athlete.medicalNotes

  // 2. Se já tiver inscrição oficial finalizada (com termos aceitos), exibe o ticket direto
  if (athlete.isAlreadyOfficial) {
    confirmedAthlete.value = athlete
    submitted.value = true
    hasStartedWizard.value = false
    clearAthleteDraft(athlete.phone)
    return
  }

  // 3. É pré-inscrição / rascunho em andamento!
  confirmedAthlete.value = null
  submitted.value = false
  hasStartedWizard.value = false // TELA INICIAL É APENAS O PRIMEIRO CARD!

  // 4. Carrega cache local de rascunho (localStorage)
  const localDraft = loadAthleteDraft(athlete.phone)
  if (localDraft && localDraft.form) {
    const df = localDraft.form
    if (df.cpf) form.cpf = df.cpf
    if (df.birthDate) {
      form.birthDate = df.birthDate
      handleBirthDateChange()
    }
    if (df.gender) form.gender = df.gender
    if (df.cityState) form.cityState = df.cityState
    if (df.email) form.email = df.email
    if (df.emergencyContactName) form.emergencyContactName = df.emergencyContactName
    if (df.emergencyContactPhone) form.emergencyContactPhone = df.emergencyContactPhone
    const draftSkewer = resolveValidSkewer(df.skewerChoice || df.shirtSize)
    form.skewerChoice = draftSkewer
    form.shirtSize = draftSkewer
    syncSkewersFromChoice(draftSkewer)
    if (df.medicalNotes !== undefined) form.medicalNotes = df.medicalNotes
    if (df.modality) form.modality = df.modality
    if (df.drinksBeer !== undefined) form.drinksBeer = df.drinksBeer
    if (df.acceptedTerms) form.acceptedTerms = df.acceptedTerms

    if (localDraft.currentStep && localDraft.currentStep >= 1) {
      savedDraftStep.value = localDraft.currentStep
      hasSavedDraft.value = true
    }
  } else {
    // Se não tinha draft local mas já tinha dados parciais no banco de dados
    if (athlete.skewerChoice || athlete.shirtSize) {
      savedDraftStep.value = 4
      hasSavedDraft.value = true
    } else if (athlete.emergencyContactName) {
      savedDraftStep.value = 3
      hasSavedDraft.value = true
    } else if (athlete.cpf) {
      savedDraftStep.value = 2
      hasSavedDraft.value = true
    } else {
      savedDraftStep.value = 1
      hasSavedDraft.value = false
    }
  }
}

const pixKeyCopied = ref(false)
function copyPixKey() {
  const pixKey = 'gabriel.souza492@gmail.com'
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pixKey)
  } else {
    // Fallback manual para clipboard
    const el = document.createElement('textarea')
    el.value = pixKey
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  pixKeyCopied.value = true
  setTimeout(() => {
    pixKeyCopied.value = false
  }, 3000)
}

// Verificação automática ao abrir link com query params (#inscricao?tel=...)
async function checkHashParams() {
  try {
    const rawHash = window.location.hash || ''
    const queryIdx = rawHash.indexOf('?')
    if (queryIdx !== -1) {
      const queryString = rawHash.slice(queryIdx + 1)
      const params = new URLSearchParams(queryString)
      const telParam = params.get('tel') || params.get('phone')

      if (telParam) {
        isAutoVerifying.value = true
        const found = await findAthleteByPhone(telParam)
        isAutoVerifying.value = false

        if (found) {
          applyVerifiedAthlete(found)
          return
        } else {
          authError.value = `Não localizamos a pré-inscrição com o número informado no link. Por favor, digite seu WhatsApp abaixo para verificar.`
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao verificar parâmetros da URL:', e)
    isAutoVerifying.value = false
  }
}

onMounted(() => {
  checkHashParams()
  window.addEventListener('hashchange', checkHashParams)
})

onUnmounted(() => {
  if (draftDebounceTimer) clearTimeout(draftDebounceTimer)
  window.removeEventListener('hashchange', checkHashParams)
})

// Validação manual caso o atleta abra o link solto ou precise conferir o número
async function handleManualAuth() {
  authError.value = ''
  const clean = manualPhoneInput.value.replace(/\D/g, '')
  if (clean.length < 10) {
    authError.value = 'Por favor, informe um número de celular/WhatsApp válido com DDD.'
    return
  }

  isVerifying.value = true
  try {
    const found = await findAthleteByPhone(manualPhoneInput.value)
    if (found) {
      applyVerifiedAthlete(found)
    } else {
      authError.value = 'Número não encontrado na lista de pré-inscrições ou lista de espera. Verifique se digitou o DDD correto ou fale com a organização.'
    }
  } catch (err) {
    authError.value = 'Erro ao consultar a base de dados. Verifique sua conexão e tente novamente.'
  } finally {
    isVerifying.value = false
  }
}

function formatManualPhone(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 11) value = value.slice(0, 11)

  if (value.length > 6) {
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
  } else if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`
  } else if (value.length > 0) {
    value = `(${value}`
  }
  manualPhoneInput.value = value
}

function formatCpf(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 11) value = value.slice(0, 11)

  if (value.length > 9) {
    value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
  } else if (value.length > 6) {
    value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`
  } else if (value.length > 3) {
    value = `${value.slice(0, 3)}.${value.slice(3)}`
  }
  form.cpf = value
}

function formatEmergencyPhone(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 11) value = value.slice(0, 11)

  if (value.length > 6) {
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
  } else if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`
  } else if (value.length > 0) {
    value = `(${value}`
  }
  form.emergencyContactPhone = value
}

function handleBirthDateChange() {
  if (!form.birthDate) {
    athleteAge.value = null
    return
  }
  const birth = new Date(form.birthDate)
  const raceDate = new Date('2026-11-29')
  let age = raceDate.getFullYear() - birth.getFullYear()
  const m = raceDate.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && raceDate.getDate() < birth.getDate())) {
    age--
  }
  athleteAge.value = age

  if (age < 18) {
    form.drinksBeer = false
  }
}

const formattedRegistrationCode = computed(() => {
  if (!confirmedAthlete.value || confirmedAthlete.value.id === undefined || confirmedAthlete.value.id === null) {
    return '00000'
  }
  const rawId = confirmedAthlete.value.id
  const numId = Number(rawId)

  // Se for o ID numérico do banco de dados (ex: 3, 15, 42)
  if (!isNaN(numId) && numId > 0 && numId < 1000000) {
    return String(numId).padStart(5, '0')
  }

  // Fallback caso seja um timestamp legado
  const idStr = String(rawId).trim()
  return idStr.slice(-5)
})

const whatsappReceiptUrl = computed(() => {
  if (!confirmedAthlete.value) return '#'

  const athlete = confirmedAthlete.value
  const isPaid = athlete.paymentStatus === 'completed'

  const title = isPaid
    ? `🍻 *INSCRIÇÃO OFICIAL CONCLUÍDA - BEER RUN DOS GORDOS 2026* 🏃‍♂️`
    : `🍻 *COMPROVANTE DE PAGAMENTO (R$ 80,00) - BEER RUN DOS GORDOS 2026* 🏃‍♂️`

  const intro = isPaid
    ? `Olá comissão! Minha inscrição oficial está concluída e confirmada no site.`
    : `Olá comissão organizadora! Acabei de realizar o pagamento da minha inscrição oficial (R$ 80,00) via PIX e estou enviando o comprovante para confirmação:`

  const text = encodeURIComponent(
    `${title}\n\n` +
    `${intro}\n\n` +
    `👤 *Atleta:* ${athlete.displayName || athlete.name}\n` +
    `🔖 *Inscrição:* BRG-${formattedRegistrationCode.value}\n` +
    `💵 *Valor da Inscrição:* R$ 80,00 (Lote Único)\n` +
    `📄 *CPF:* ${athlete.cpf ? athlete.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4') : 'Cadastrado'}\n` +
    `📱 *WhatsApp:* ${athlete.phone}\n` +
    `🏃 *Modalidade:* ${athlete.modality === 'caminhada' ? 'Caminhada 6.37 KM' : 'Corrida 6.37 KM'}\n` +
    `🍢 *Espetinhos Chegada (2 un):* ${athlete.skewerChoice || athlete.shirtSize || '1 Carne + 1 Frango'}\n` +
    `🍺 *Chopp:* ${athlete.drinksBeer ? 'Sim, liberado!' : 'Apenas hidratação'}\n` +
    `📋 *Status:* ${isPaid ? 'CONCLUÍDO (PAGO)' : 'AGUARDANDO PAGAMENTO'}\n\n` +
    (isPaid
      ? `_Nos vemos na largada dia 29 de Novembro de 2026! Valeu!_`
      : `_Segue o comprovante em anexo. Podem conferir e atualizar o status para CONCLUÍDO por favor? Obrigado!_`)
  )

  return `https://wa.me/5535997500430?text=${text}`
})

function printReceipt() {
  window.print()
}

async function handleSubmit() {
  submitError.value = ''

  if (!verifiedAthlete.value) {
    submitError.value = 'Sessão expirada ou não autenticada. Valide seu WhatsApp novamente.'
    return
  }

  const cleanCpf = form.cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) {
    submitError.value = 'Por favor, informe um CPF válido com 11 dígitos.'
    return
  }

  if (!form.emergencyContactName.trim()) {
    submitError.value = 'Por favor, informe o nome do seu contato de emergência.'
    return
  }

  const cleanEmergPhone = form.emergencyContactPhone.replace(/\D/g, '')
  if (cleanEmergPhone.length < 10) {
    submitError.value = 'Por favor, informe o telefone do contato de emergência com DDD.'
    return
  }

  if (!form.skewerChoice) {
    submitError.value = 'Por favor, selecione sua preferência para os 2 espetinhos da chegada.'
    return
  }

  if (!form.acceptedTerms) {
    submitError.value = 'Você deve ler e marcar a caixa de concordância com o regulamento oficial para confirmar sua inscrição.'
    return
  }

  isSubmitting.value = true

  try {
    trackEvent('submit_inscricao_oficial', {
      modalidade: form.modality,
      espetinhos: form.skewerChoice,
      chopp: form.drinksBeer
    })

    // Garante que o nome e o telefone gravados sejam exatamente os da pré-inscrição autenticada
    const result = await registerOfficialAthlete({
      id: verifiedAthlete.value.id,
      name: verifiedAthlete.value.name,
      nickname: form.nickname,
      cpf: form.cpf,
      birthDate: form.birthDate,
      gender: form.gender,
      phone: verifiedAthlete.value.phone,
      email: form.email,
      cityState: form.cityState,
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
      modality: form.modality,
      drinksBeer: form.drinksBeer,
      skewerChoice: form.skewerChoice,
      shirtSize: form.skewerChoice,
      medicalNotes: form.medicalNotes,
      acceptedTerms: form.acceptedTerms
    })

    confirmedAthlete.value = result
    submitted.value = true
    hasStartedWizard.value = false
    hasSavedDraft.value = false
    clearAthleteDraft(verifiedAthlete.value.phone)

    trackEvent('conversao_inscricao_oficial_sucesso', {
      atleta: verifiedAthlete.value.name,
      modalidade: form.modality
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    console.error('Falha ao registrar inscrição oficial:', err)
    submitError.value = err.message || 'Ocorreu um erro ao salvar sua inscrição. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.official-reg-page {
  min-height: 100vh;
  background-color: var(--bg-parchment);
  background-image: linear-gradient(rgb(247 241 228 / 60%), rgb(247 241 228)), url(/bg02.jpg);
  background-size: cover;
  background-position: top center;
  background-repeat: repeat-y;
  color: var(--text-dark);
  padding-bottom: 80px;
}

/* Header de navegação superior */
.reg-top-bar {
  background-color: rgb(25 23 20 / 94%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(218, 165, 32, 0.35);
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.reg-top-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.btn-back-home {
  background: none;
  border: 1px solid rgba(218, 165, 32, 0.6);
  border-radius: 4px;
  color: var(--accent-gold);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 6px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-back-home:hover {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
}

.btn-back-desktop {
  display: inline;
}

.btn-back-mobile {
  display: none;
}

.brand-badge {
  color: var(--text-light);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-badge i {
  color: var(--accent-gold);
}

/* Conteúdo Principal */
.reg-main-content {
  max-width: 960px;
  margin: 24px auto 0 auto;
  padding: 0 16px;
}

/* ==========================================================================
   BARREIRA DE SEGURANÇA (ACESSO RESTRITO)
   ========================================================================== */
.auth-barrier-section {
  max-width: 540px;
  margin: 28px auto;
}

.auth-card {
  padding: 28px 24px;
  background-color: #fffdfa;
  border: 1px solid #dfd5c4;
  box-shadow: 0 4px 20px rgba(25, 23, 20, 0.05);
  border-radius: 10px;
  position: relative;
}

.auth-card.text-center {
  text-align: center;
}

.auth-icon-box {
  margin-bottom: 12px;
}

.auth-icon {
  font-size: 2.2rem;
  color: var(--accent-gold);
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  font-weight: 800;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  letter-spacing: 0.4px;
}

.auth-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.auth-icon-circle {
  width: 48px;
  height: 48px;
  min-width: 48px;
  background-color: #f6eedf;
  border: 1px solid #dfd5c4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: var(--accent-gold);
}

.auth-title {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--accent-dark);
  line-height: 1.2;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.auth-error-banner {
  background-color: #fdf3f2;
  color: #78281f;
  border: 1px solid #e74c3c;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: #4a443a;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: block;
  margin-bottom: 6px;
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.auth-input {
  font-size: 1.05rem !important;
  font-weight: 700;
  padding: 9px 12px !important;
  letter-spacing: 0.5px;
}

.btn-auth {
  white-space: nowrap;
  font-size: 0.92rem;
  padding: 9px 16px;
  border-radius: 6px;
}

.auth-footer-help {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed rgba(44, 39, 31, 0.2);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.auth-help-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-dark);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-family: inherit;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.link-btn.wa-help {
  color: #128c7e;
}

/* ==========================================================================
   TELA INICIAL: PRIMEIRO CARD ISOLADO DE CONVOCAÇÃO DO ATLETA (MINIMALISTA)
   ========================================================================== */
.welcome-card-section {
  max-width: 580px;
  margin: 24px auto 48px auto;
}

.welcome-athlete-card {
  background-color: #fffdfa;
  border: 1px solid #dfd5c4;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(25, 23, 20, 0.05);
  padding: 28px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.welcome-shield-circle {
  width: 52px;
  height: 52px;
  background-color: #edf7ed;
  border: 1.5px solid #27ae60;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #27ae60;
  margin-bottom: 2px;
}

.welcome-tag {
  font-size: 0.8rem;
  font-weight: 800;
  color: #b75e00;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.welcome-name {
  font-size: 1.8rem;
  color: var(--accent-dark);
  line-height: 1.2;
  margin: 2px 0 6px 0;
  letter-spacing: -0.3px;
}

.welcome-phone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.88rem;
  color: #4a4439;
  background-color: #f6eedf;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #dfcfb2;
}

.welcome-phone strong {
  font-size: 0.92rem;
  color: var(--accent-dark);
}

.lock-pill {
  background-color: #eee4d1;
  border: 1px solid #d5c3a1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #6a6458;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.welcome-divider {
  width: 100%;
  height: 1px;
  border-top: 1px dashed rgba(44, 39, 31, 0.2);
  margin: 18px 0;
}

.welcome-body {
  text-align: left;
  margin-bottom: 24px;
}

.welcome-lead {
  font-size: 0.95rem;
  color: var(--accent-dark);
  line-height: 1.45;
  margin-bottom: 8px;
}

.welcome-instruction {
  font-size: 0.86rem;
  color: #554e42;
  line-height: 1.4;
  margin-bottom: 16px;
}

/* Grid de Prévia das 4 Etapas */
.welcome-steps-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.preview-step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #faf6ee;
  border: 1px solid #e5dccf;
  border-radius: 6px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.preview-step-item.preview-done {
  background-color: #edf7ed;
  border-color: #a3d9a5;
}

.preview-step-item.preview-done .preview-num {
  background-color: #27ae60;
  color: #fff;
  border-color: #1e8449;
}

.preview-step-item.preview-active {
  border-color: var(--accent-gold);
  background-color: #fffdf8;
  box-shadow: 0 2px 6px rgba(218, 165, 32, 0.15);
}

.preview-num {
  width: 26px;
  height: 26px;
  min-width: 26px;
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  border: 1px solid var(--accent-gold);
}

.preview-text {
  display: flex;
  flex-direction: column;
}

.preview-text strong {
  font-size: 0.84rem;
  color: var(--accent-dark);
}

.preview-text span {
  font-size: 0.74rem;
  color: #726b5f;
  line-height: 1.2;
}

/* Caixa de Rascunho Recuperado */
.draft-resume-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #fff9ed;
  border: 1px solid #e67e22;
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 14px;
  text-align: left;
}

.draft-resume-icon {
  font-size: 1.3rem;
  color: #d35400;
  margin-top: 2px;
}

.draft-resume-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.draft-resume-info strong {
  font-size: 0.85rem;
  color: #a04000;
  letter-spacing: 0.3px;
}

.draft-resume-info span {
  font-size: 0.8rem;
  color: #5d4037;
  line-height: 1.3;
}

/* Ações do Card de Boas-Vindas */
.welcome-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-start-wizard {
  width: 100%;
  max-width: 420px;
  padding: 11px 22px;
  font-size: 1.05rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
  color: #191714;
  border: 1px solid #191714;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 800;
}

.btn-start-wizard:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}

.btn-start-wizard:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.btn-restart-draft {
  background: none;
  border: none;
  color: #777;
  font-size: 0.84rem;
  text-decoration: underline;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  transition: color 0.15s ease;
}

.btn-restart-draft:hover {
  color: var(--accent-dark);
}

.welcome-footer-guarantee {
  font-size: 0.82rem;
  color: #7a7265;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.welcome-footer-guarantee i {
  color: #27ae60;
}

/* ==========================================================================
   CARD DE IDENTIFICAÇÃO DO ATLETA (2 LINHAS: BEM ALINHADO E DEFINIDO)
   ========================================================================== */
.athlete-mini-bar {
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: #fffdfa;
  border: 1px solid #dfd5c4;
  border-radius: 8px;
  padding: 9px 14px;
  margin: 0 auto 14px auto;
  max-width: 520px;
  box-shadow: 0 2px 8px rgba(25, 23, 20, 0.04);
}

/* Linha 1: Nome do Atleta e Status */
.mini-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mini-bar-name-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
}

.mini-bar-name-wrap i {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.mini-bar-name {
  font-weight: 700;
  color: var(--accent-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.96rem;
  letter-spacing: -0.2px;
}

.mini-bar-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #edf7ed;
  color: #27ae60;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Linha 2: WhatsApp e Ação */
.mini-bar-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #f2e9dc;
}

.mini-bar-phone-wrap {
  display: flex;
  align-items: center;
}

.mini-bar-phone {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: #554e42;
  white-space: nowrap;
}

.mini-bar-phone i {
  color: #8c7853;
  font-size: 0.76rem;
}

.phone-label {
  color: #887e6f;
  font-weight: 600;
}

.mini-bar-phone strong {
  color: #2b261f;
  font-weight: 700;
}

.btn-mini-back {
  background: #f7f2e7;
  border: 1px solid #dcd1be;
  border-radius: 4px;
  padding: 3px 9px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #554e42;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.btn-mini-back:hover {
  background-color: #f0e4cd;
  color: var(--accent-dark);
  border-color: #bda888;
}

/* ==========================================================================
   STEPPER ULTRA-MINIMALISTA (LINHA COM CÍRCULOS)
   ========================================================================== */
.wizard-stepper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 200px;
  margin: 0 auto 14px auto;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.wizard-stepper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  height: 1.5px;
  background-color: #dcd3c4;
  transform: translateY(-50%);
  z-index: 1;
}

.step-tab {
  position: relative;
  z-index: 2;
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background-color: #fdfaf4;
  border: 1.5px solid #d4cbbd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex: none;
}

.step-tab:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f0e9dc;
  border-color: #d8cdb8;
  box-shadow: none;
}

.step-badge {
  font-family: var(--font-slab);
  font-weight: 800;
  font-size: 0.82rem;
  color: #665f53;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.step-tab.active {
  background-color: #25221d;
  border-color: var(--accent-gold);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transform: scale(1.12);
}

.step-tab.active .step-badge {
  color: var(--accent-gold);
  font-weight: 900;
}

.step-tab.completed {
  background-color: #27ae60;
  border-color: #27ae60;
}

.step-tab.completed .step-badge {
  color: #fff;
  font-size: 0.75rem;
}

.btn-text-desktop {
  display: inline;
}

.btn-text-mobile {
  display: none;
}

/* Transições suaves entre etapas */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ==========================================================================
   FORMULÁRIO E CARD DAS ETAPAS (MINIMALISTA)
   ========================================================================== */
.form-section-card {
  max-width: 520px;
  margin: 0 auto 16px auto;
  padding: 20px 22px;
  background-color: #fffdfa;
  border: 1px solid #dfd5c4;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(25, 23, 20, 0.04);
}

.step-header {
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee5d8;
}

.section-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--accent-dark);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px 0;
  letter-spacing: 0.3px;
}

.step-num {
  background-color: var(--accent-gold);
  color: #191714;
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  border: 1px solid #191714;
}

.step-subtitle {
  font-size: 0.78rem;
  color: #7a7266;
  margin: 0;
  line-height: 1.35;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 4px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #443e35;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px;
}

.locked-hint {
  font-size: 0.7rem;
  font-weight: 600;
  color: #b75e00;
  text-transform: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.field-desc {
  font-size: 0.72rem;
  font-weight: normal;
  color: #7a7266;
  text-transform: none;
}

.optional-tag {
  font-size: 0.7rem;
  color: #999;
  font-weight: normal;
  text-transform: none;
}

.vintage-input {
  width: 100%;
  padding: 8px 11px;
  background-color: #ffffff;
  border: 1px solid #d4cbbd;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #191714;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.vintage-input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2.5px rgba(217, 130, 43, 0.15);
  background-color: #ffffff;
}

/* Campos Bloqueados */
.input-locked-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-locked {
  background-color: #f7f3ec !important;
  color: #3b352b !important;
  font-weight: 600;
  cursor: not-allowed;
  border-color: #dfd7ca !important;
  padding-right: 32px !important;
}

.lock-indicator {
  position: absolute;
  right: 10px;
  color: #958a78;
  font-size: 0.85rem;
}

.age-badge {
  font-size: 0.76rem;
  color: #666;
  margin-top: 2px;
}

.text-warning {
  color: #c0392b;
  font-weight: bold;
}

.toggle-options-row {
  display: flex;
  gap: 8px;
}

.toggle-pill {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #d4cbbd;
  background-color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.toggle-pill.active {
  background-color: #25221d;
  color: var(--accent-gold);
  border-color: #25221d;
}

/* Escolha de Modalidade e Chopp - 2 Colunas Limpas */
.choice-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.choice-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #dfd6c6;
  border-radius: 6px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.18s ease;
}

.choice-card:hover {
  background-color: #faf6ee;
}

.choice-card.selected {
  border-color: var(--accent-gold);
  background-color: #fffdf5;
  box-shadow: 0 0 0 1px var(--accent-gold);
}

.choice-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.choice-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.choice-text strong {
  font-size: 0.8rem;
  color: var(--accent-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.choice-text span {
  font-size: 0.68rem;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Seletor Minimalista de Espetinhos em 3 Linhas Elegantes */
.skewer-box {
  background-color: #ffffff;
  border: 1px solid #dfd6c6;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skewer-rows-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skewer-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #faf6ee;
  border: 1px solid #e7ded0;
  border-radius: 6px;
  transition: all 0.18s ease;
}

.skewer-row-item.is-disabled {
  opacity: 0.35;
  pointer-events: none;
}

.skewer-row-veg {
  cursor: pointer;
  background-color: #ffffff;
  border: 1px dashed #cfc5b3;
}

.skewer-row-veg:hover {
  background-color: #f7faf4;
}

.skewer-row-veg.active {
  background-color: #f0f8ec;
  border: 1px solid #7cb342;
}

.skewer-row-veg.active .skewer-item-names strong {
  color: #2e7d32;
}

.skewer-item-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skewer-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.skewer-item-names {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.skewer-item-names strong {
  font-size: 0.85rem;
  color: var(--accent-dark);
}

.skewer-item-names small {
  font-size: 0.72rem;
  color: #777;
}

.stepper-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #ffffff;
  padding: 3px 6px;
  border-radius: 5px;
  border: 1px solid #dfd6c6;
}

.btn-stepper {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid #d4cbbd;
  background-color: #f7f3ec;
  color: #25221d;
  font-size: 0.76rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-stepper:hover:not(:disabled) {
  background-color: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #1a1714;
}

.btn-stepper:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  background-color: #eee9e0;
}

.stepper-count {
  font-size: 1.05rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  color: #191714;
}

.veg-toggle-action {
  display: flex;
  align-items: center;
}

.veg-switch {
  width: 20px;
  height: 20px;
  border: 1.5px solid #bbb;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #ffffff;
  background-color: #ffffff;
  transition: all 0.15s ease;
}

.veg-switch.checked {
  border-color: #7cb342;
  background-color: #7cb342;
  color: #ffffff;
}

.skewer-summary-bar {
  padding-top: 6px;
  border-top: 1px dashed #ece4d7;
  font-size: 0.76rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-veg {
  color: #2e7d32;
  font-weight: 600;
}

.text-standard {
  color: #444;
}

.text-veg {
  color: #2e7d32;
  font-weight: 600;
}

.text-standard {
  color: #444;
}

.step-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px dashed #e2d9cc;
}

.btn-step-next {
  font-size: 0.88rem;
  padding: 8px 18px;
  margin-left: auto;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
  color: #191714;
  border: 1px solid #191714;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-step-next:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.btn-step-back {
  background-color: #fff !important;
  color: #444 !important;
  font-size: 0.85rem;
  padding: 8px 14px;
  border: 1px solid #d4cbbd !important;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-step-back:hover {
  background-color: #f5eedf !important;
  color: #191714 !important;
}

.final-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.final-actions .btn-submit-registration {
  margin: 0;
  width: auto;
  max-width: none;
  flex: 1;
}

/* Seção do Regulamento */
.regulation-card {
  border: 1px solid #dfd5c4;
}

.reg-intro-text {
  font-size: 0.85rem;
  color: #443e35;
  margin-bottom: 12px;
  line-height: 1.4;
}

.rules-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.rule-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background-color: #faf6ee;
  border: 1px solid #e5dccf;
  padding: 8px 10px;
  border-radius: 6px;
}

.rule-icon {
  font-size: 1.1rem;
  color: var(--accent-gold);
}

.rule-box strong {
  font-size: 0.82rem;
  color: var(--accent-dark);
  display: block;
}

.rule-box p {
  font-size: 0.74rem;
  color: #665f53;
  line-height: 1.25;
  margin-top: 1px;
}

/* Visualizador de PDF */
.pdf-viewer-container {
  background-color: #25221d;
  border: 1px solid #3d3830;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
  color: #f5eedc;
}

.pdf-viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 8px;
}

.pdf-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}

.text-red {
  color: #e74c3c;
  font-size: 1.1rem;
}

.pdf-actions {
  display: flex;
  gap: 6px;
}

.btn-pdf-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 5px 10px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.76rem;
  transition: all 0.2s ease;
}

.btn-pdf-action:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

.btn-pdf-action.highlight {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
  border-color: var(--accent-gold);
}

.btn-pdf-action.highlight:hover {
  background-color: var(--accent-amber);
}

.pdf-embed-wrapper {
  width: 100%;
  height: 340px;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.3);
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-hint {
  font-size: 0.74rem;
  color: #a89f8e;
  margin-top: 6px;
  font-style: italic;
}

/* Caixa de Termo e Aceite */
.terms-acceptance-box {
  background-color: #fffdf5;
  border: 1px solid #dfcba5;
  border-radius: 6px;
  padding: 10px 12px;
  margin-top: 12px;
}

.terms-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.vintage-checkbox {
  width: 18px;
  height: 18px;
  min-width: 18px;
  accent-color: var(--accent-gold);
  cursor: pointer;
  margin-top: 2px;
}

.terms-text {
  font-size: 0.8rem;
  color: #333;
  line-height: 1.35;
}

/* Envio e Ações */
.submit-action-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.btn-submit-registration {
  font-size: 0.95rem;
  padding: 10px 22px;
  width: 100%;
  max-width: 420px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
  color: #191714;
  border: 1px solid #191714;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit-registration:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);
}

.btn-submit-registration:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-guarantee {
  font-size: 0.78rem;
  color: #726b5f;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-banner {
  background-color: #fdf3f2;
  color: #78281f;
  border: 1px solid #e74c3c;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: 700;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==========================================================================
   TELA DE CONFIRMAÇÃO / CHECKOUT / PAGAMENTO
   ========================================================================== */
.confirmation-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.checkout-card {
  width: 100%;
  max-width: 580px;
  background: #fffdf9;
  border: 1px solid #dfd5c4;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(25, 23, 20, 0.08);
  overflow: hidden;
}

/* Faixa de topo elegante */
.checkout-header-ribbon {
  background: linear-gradient(135deg, #24201b 0%, #161412 100%);
  color: #fff;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.3);
}

.checkout-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.6px;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.status-pending {
  background: rgba(211, 84, 0, 0.16);
  border: 1px solid rgba(230, 126, 34, 0.6);
  color: #f39c12;
}

.status-completed {
  background: rgba(39, 174, 96, 0.16);
  border: 1px solid rgba(46, 204, 113, 0.6);
  color: #2ecc71;
}

.status-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  display: inline-block;
  animation: pulse-dot 1.8s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}

.checkout-ticket-num {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.num-lbl {
  font-size: 0.72rem;
  color: #a89f91;
  letter-spacing: 0.8px;
  font-weight: 700;
  text-transform: uppercase;
}

.num-badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(218, 165, 32, 0.45);
  color: #f9d877;
  font-weight: 700;
  font-size: 0.84rem;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.6px;
  font-family: monospace;
}

/* Corpo do Checkout */
.checkout-body {
  padding: 18px 18px 14px 18px;
}

/* Resumo do Atleta */
.checkout-athlete-summary {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(44, 39, 31, 0.2);
}

.checkout-subtitle {
  font-size: 0.74rem;
  font-weight: 700;
  color: #8c6d37;
  letter-spacing: 0.8px;
  display: block;
  margin-bottom: 2px;
}

.checkout-athlete-name {
  font-size: 1.5rem;
  color: var(--accent-dark);
  margin-bottom: 8px;
  line-height: 1.15;
}

.checkout-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.checkout-chip {
  background: #f7f1e6;
  border: 1px solid #e2d6c1;
  color: #4a3e2e;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.checkout-chip i {
  color: var(--accent-amber);
}

/* Seção de Pagamento */
.checkout-payment-box {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Box de Preço Destacado */
.checkout-price-card {
  background: linear-gradient(135deg, #fff9f0 0%, #fef3e2 100%);
  border: 2px solid #e09f3e;
  border-radius: 10px;
  padding: 12px 14px;
  text-align: center;
  box-shadow: 0 3px 12px rgba(224, 159, 62, 0.12);
}

.price-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 2px;
}

.price-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #8c5310;
  letter-spacing: 0.6px;
}

.price-batch {
  background-color: #8c5310;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.4px;
}

.price-amount-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  color: #6d3a00;
  line-height: 1;
  margin: 4px 0 8px 0;
}

.price-currency {
  font-size: 1.4rem;
  font-weight: 700;
  margin-right: 4px;
}

.price-value {
  font-size: 2.9rem;
  font-weight: 900;
  letter-spacing: -1px;
}

.price-cents {
  font-size: 1.4rem;
  font-weight: 700;
}

.price-includes-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 4px;
}

.price-includes-tags span {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(224, 159, 62, 0.4);
  color: #5c3c13;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.price-includes-tags span i {
  color: #27ae60;
  font-size: 0.68rem;
}

/* Box Chave PIX */
.checkout-pix-box {
  background: #ffffff;
  border: 1px solid #dfd5c4;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pix-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.pix-badge {
  color: #00875a;
  font-weight: 800;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pix-recipient {
  font-size: 0.78rem;
  color: #666;
}

.pix-recipient strong {
  color: var(--accent-dark);
}

.pix-copy-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fdfaf4;
  border: 1px solid #dfd5c4;
  border-radius: 6px;
  padding: 8px 12px;
  gap: 8px;
}

.pix-key-display {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pix-key-type {
  font-size: 0.68rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 0.3px;
}

.pix-key-string {
  font-size: 0.95rem;
  color: var(--accent-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-copy-pix {
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
  padding: 7px 14px;
  border-radius: 5px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-copy-pix:hover {
  background-color: #000;
  color: #fff;
  border-color: #fff;
}

.btn-copy-pix.btn-copied {
  background-color: #27ae60;
  border-color: #1e8449;
  color: #fff;
}

.pix-instruction-hint {
  font-size: 0.8rem;
  color: #555;
  line-height: 1.35;
  margin: 0;
}

.pix-instruction-hint i {
  color: var(--accent-amber);
}

/* CTA Zone */
.checkout-cta-zone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
  width: 100%;
}

.btn-whatsapp-checkout {
  width: 100%;
  background-color: #25d366;
  color: #ffffff;
  border: 2px solid #128c7e;
  padding: 13px 18px;
  font-size: 1.05rem;
  font-weight: 800;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-whatsapp-checkout:hover {
  background-color: #1ebe5d;
  box-shadow: 0 6px 18px rgba(37, 211, 102, 0.45);
  transform: translateY(-1px);
  color: #fff;
}

.cta-note {
  font-size: 0.76rem;
  color: #666;
  text-align: center;
  margin: 0;
}

.cta-note i {
  color: #27ae60;
}

/* Completed State */
.checkout-completed-box {
  text-align: center;
  padding: 20px 10px;
}

.completed-badge-icon {
  font-size: 3rem;
  color: #27ae60;
  margin-bottom: 10px;
}

.completed-h3 {
  font-size: 1.35rem;
  color: #1e8449;
  margin-bottom: 8px;
}

.completed-p {
  font-size: 0.92rem;
  color: #444;
  line-height: 1.4;
  margin-bottom: 18px;
}

/* Ações Secundárias */
.checkout-secondary-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(44, 39, 31, 0.15);
  font-size: 0.82rem;
}

.btn-sec-link {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  transition: color 0.2s;
}

.btn-sec-link:hover {
  color: var(--accent-dark);
  text-decoration: underline;
}

.sec-divider {
  color: #bbb;
}

/* Faixa rodapé */
.checkout-footer-strip {
  background-color: #f7f1e6;
  border-top: 1px solid #dfd5c4;
  padding: 8px 16px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #8c7f6f;
  letter-spacing: 0.6px;
}

/* Print Styles */
@media print {
  .reg-top-bar,
  .checkout-cta-zone,
  .checkout-secondary-actions,
  .btn-copy-pix {
    display: none !important;
  }

  .official-reg-page {
    background: none !important;
    padding: 0 !important;
  }

  .checkout-card {
    box-shadow: none !important;
    border: 2px solid #000 !important;
    max-width: 100% !important;
  }
}

/* Responsividade Mobile Minimalista */
@media (max-width: 768px) {
  .reg-top-bar {
    padding: 8px 0;
  }

  .btn-back-desktop {
    display: none !important;
  }

  .btn-back-mobile {
    display: inline !important;
  }

  .brand-badge {
    font-size: 0.76rem;
  }

  .reg-main-content {
    margin-top: 12px;
    padding: 0 10px;
  }

  .auth-card {
    padding: 20px 14px;
    border-radius: 8px;
  }

  .auth-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }

  .input-with-button {
    flex-direction: column;
    gap: 8px;
  }

  .welcome-athlete-card {
    padding: 20px 14px;
    border-radius: 10px;
  }

  .welcome-shield-circle {
    width: 44px;
    height: 44px;
    font-size: 1.5rem;
  }

  .welcome-name {
    font-size: 1.4rem;
    line-height: 1.2;
  }

  .welcome-phone {
    font-size: 0.82rem;
    padding: 4px 10px;
  }

  .welcome-lead {
    font-size: 0.88rem;
  }

  .welcome-instruction {
    font-size: 0.82rem;
    margin-bottom: 12px;
  }

  .welcome-steps-preview {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .preview-step-item {
    padding: 7px 10px;
  }

  .btn-start-wizard {
    font-size: 0.98rem;
    padding: 10px 14px;
  }

  /* Barra Mini do Atleta no Mobile: 2 Linhas Alinhadas e Bem Definidas */
  .athlete-mini-bar {
    padding: 8px 12px;
    margin: 0 auto 12px auto;
    gap: 6px;
    border-radius: 8px;
    max-width: 100%;
  }

  .mini-bar-top {
    gap: 8px;
  }

  .mini-bar-name {
    font-size: 0.9rem;
  }

  .mini-bar-badge {
    font-size: 0.68rem;
    padding: 2px 5px;
  }

  .mini-bar-bottom {
    padding-top: 5px;
    gap: 8px;
  }

  .mini-bar-phone {
    font-size: 0.78rem;
  }

  .btn-mini-back {
    padding: 3px 8px;
    font-size: 0.72rem;
  }

  /* Stepper Minimalista no Mobile: linha sutil com 4 pequenos círculos */
  .wizard-stepper {
    max-width: 190px;
    margin: 0 auto 12px auto;
    background: transparent !important;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .wizard-stepper::before {
    left: 8px;
    right: 8px;
  }

  .step-tab {
    width: 26px;
    height: 26px;
    min-width: 26px;
  }

  .step-badge {
    font-size: 0.78rem;
  }

  .step-tab.active {
    transform: scale(1.1);
  }

  .step-tab.completed .step-badge {
    font-size: 0.7rem;
  }

  /* Card da Etapa no Mobile */
  .form-section-card {
    padding: 14px 14px;
    margin: 0 auto 14px auto;
    border-radius: 8px;
  }

  .step-header {
    margin-bottom: 12px;
    padding-bottom: 6px;
  }

  .section-title {
    font-size: 0.95rem;
    gap: 6px;
  }

  .step-num {
    width: 18px;
    height: 18px;
    min-width: 18px;
    font-size: 0.74rem;
  }

  .step-subtitle {
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .form-label {
    font-size: 0.76rem;
    gap: 4px;
  }

  .vintage-input {
    padding: 7px 10px;
    font-size: 0.86rem;
    border-radius: 5px;
  }

  /* Alternância de textos nos botões */
  .btn-text-desktop {
    display: none !important;
  }

  .btn-text-mobile {
    display: inline !important;
  }

  /* Botões do Rodapé no Mobile (Lado a Lado Compacto) */
  .step-footer-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 14px;
    padding-top: 10px;
  }

  .step-footer-actions .btn-step-back {
    flex: 0 0 auto;
    padding: 8px 12px;
    font-size: 0.82rem;
    margin: 0;
  }

  .step-footer-actions .btn-step-next,
  .step-footer-actions .btn-submit-registration {
    flex: 1;
    padding: 8px 12px;
    font-size: 0.86rem;
    margin: 0;
    justify-content: center;
  }

  .final-actions {
    flex-direction: row;
  }

  /* Camisetas e Escolhas no Mobile */
  .choice-card {
    padding: 7px 10px;
    gap: 8px;
  }

  .choice-icon {
    font-size: 1.15rem;
  }

  .choice-text strong {
    font-size: 0.82rem;
  }

  .choice-text span {
    font-size: 0.72rem;
  }

  .sizes-grid {
    gap: 5px;
  }

  .size-btn {
    padding: 5px 8px;
    font-size: 0.8rem;
    flex: 1;
    min-width: 50px;
    text-align: center;
  }

  .rules-summary-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .rule-box {
    padding: 6px 8px;
    gap: 6px;
  }

  .rule-icon {
    font-size: 1rem;
  }

  .rule-box strong {
    font-size: 0.8rem;
  }

  .rule-box p {
    font-size: 0.72rem;
  }

  .pdf-embed-wrapper {
    height: 240px;
  }

  .pdf-viewer-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .pdf-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-pdf-action {
    justify-content: center;
    width: 100%;
  }

  .checkout-card {
    border-radius: 8px;
  }

  .checkout-header-ribbon {
    padding: 8px 12px;
    gap: 8px;
  }

  .checkout-status-badge {
    font-size: 0.72rem;
    padding: 3px 8px;
    gap: 5px;
  }

  .num-lbl {
    font-size: 0.68rem;
  }

  .num-badge {
    font-size: 0.78rem;
    padding: 2px 6px;
  }

  .checkout-body {
    padding: 16px 12px 14px 12px;
  }

  .checkout-athlete-name {
    font-size: 1.35rem;
  }

  .price-value {
    font-size: 2.6rem;
  }

  .pix-copy-container {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 8px;
  }

  .pix-key-display {
    align-items: center;
  }

  .btn-copy-pix {
    justify-content: center;
    width: 100%;
  }

  .btn-whatsapp-checkout {
    font-size: 0.95rem;
    padding: 12px 14px;
  }

  .checkout-secondary-actions {
    flex-direction: column;
    gap: 6px;
  }

  .sec-divider {
    display: none;
  }
}
</style>
