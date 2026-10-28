<template>
  <div class="staff-page-view animate-fade-in">
    <!-- TELA 1: LOGIN EM TELA CHEIA (CASO NÃO AUTENTICADO) -->
    <div v-if="!isAuthenticated" class="staff-login-screen">
      <div class="login-top-bar">
        <button class="btn-back-to-site font-slab" @click="$emit('exit-staff')">
          <i class="fa-solid fa-arrow-left"></i> Voltar ao Site Oficial
        </button>
      </div>

      <div class="login-center-container">
        <div class="staff-login-card vintage-card animate-slide-up">
          <div class="modal-seal-badge font-slab">
            ★ ÁREA RESTRITA ★
          </div>

          <div class="login-header text-center">
            <div class="vintage-icon">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h1 class="font-slab login-title">ACESSO DO STAFF</h1>
            <p class="login-sub font-condensed">
              Painel de controle oficial da Beer Run dos Gordos. Digite a senha mestre de organizador para continuar.
            </p>
          </div>

          <form @submit.prevent="handleLoginSubmit" class="login-form">
            <div class="form-group">
              <label for="staff-pin-page" class="form-label font-slab">SENHA / PIN DE ADMIN</label>
              <div class="input-wrap">
                <input
                  id="staff-pin-page"
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

            <div v-if="loginErrorMessage" class="error-banner animate-shake font-condensed">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ loginErrorMessage }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel font-condensed" @click="$emit('exit-staff')">
                Voltar ao Site
              </button>
              <button type="submit" class="btn-vintage btn-submit font-slab" :disabled="isLoading || athletesLoading">
                <i class="fa-solid fa-key"></i> ENTRAR NO PAINEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- TELA 2: DASHBOARD COMPLETO EM TELA CHEIA (AUTENTICADO) -->
    <div v-else class="staff-app-container">
      <div v-if="staffError" class="error-banner" role="alert">{{ staffError }}</div>
      <!-- Sticky Header + Nav Bar Group (Elimina gaps e magic numbers) -->
      <div class="staff-sticky-top">
        <!-- Top App Bar -->
        <header class="staff-header">
          <div class="header-left">
            <button class="btn-back-site font-slab" @click="$emit('exit-staff')" title="Retornar para o site oficial">
              <i class="fa-solid fa-arrow-left"></i>
              <span class="btn-text-desktop">Voltar ao Site</span>
              <span class="btn-text-mobile">Site</span>
            </button>

            <div class="brand-info">
              <h1 class="brand-title font-slab">
                <i class="fa-solid fa-beer-mug-empty"></i>
                <span class="brand-title-full">BEER RUN STAFF</span>
                <span class="brand-title-short">STAFF</span>
              </h1>
              <div class="db-status-pill font-condensed" :class="{ 'status-online': !athletesError && !staffError, 'status-local': athletesError || staffError }">
                <span class="status-dot"></span>
                <span class="status-text-full">{{ athletesError || staffError ? 'Falha ao atualizar' : 'Sessão autenticada' }}</span>
                <span class="status-text-short">{{ athletesError || staffError ? 'Erro' : 'Online' }}</span>
              </div>
            </div>
          </div>

          <div class="header-right">
            <button class="btn-tool font-condensed" @click="refreshAll" :disabled="isLoading || athletesLoading" title="Recarregar Dados">
              <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isLoading }"></i>
              <span class="btn-label-desktop">Atualizar</span>
            </button>
            <button class="btn-tool btn-logout font-condensed" @click="handleLogout" title="Sair da Conta Staff">
              <i class="fa-solid fa-right-from-bracket"></i>
              <span class="btn-label-desktop">Sair</span>
            </button>
          </div>
        </header>

        <!-- Sticky Navigation Tabs (100% sem scroll no mobile!) -->
        <nav class="staff-nav-tabs">
          <div class="tabs-scroll-wrapper">
            <button class="tab-btn font-slab" :class="{ active: activeTab === 'team' }" @click="activeTab = 'team'">
              <i class="fa-solid fa-users" aria-hidden="true"></i>
              <span class="tab-label-desktop">Equipe</span>
              <span class="tab-label-mobile">Equipe</span>
            </button>
            <button
              class="tab-btn font-slab"
              :class="{ active: activeTab === 'overview' }"
              @click="activeTab = 'overview'"
            >
              <i class="fa-solid fa-chart-pie"></i>
              <span class="tab-label-desktop">Visão Geral</span>
              <span class="tab-label-mobile">Geral</span>
            </button>

            <button
              class="tab-btn font-slab"
              :class="{ active: activeTab === 'athletes' }"
              @click="activeTab = 'athletes'"
            >
              <i class="fa-solid fa-person-running"></i>
              <span class="tab-label-desktop">Atletas</span>
              <span class="tab-label-mobile">Atletas</span>
              <span class="tab-badge">{{ athletes.length }}</span>
            </button>

            <button
              class="tab-btn font-slab"
              :class="{ active: activeTab === 'waitlist' }"
              @click="activeTab = 'waitlist'"
            >
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span class="tab-label-desktop">Lista de Espera</span>
              <span class="tab-label-mobile">Espera</span>
              <span v-if="activeWaitlist.length > 0" class="tab-badge badge-warning">{{ activeWaitlist.length }}</span>
            </button>

            <button
              class="tab-btn font-slab"
              :class="{ active: activeTab === 'sponsors' }"
              @click="activeTab = 'sponsors'"
            >
              <i class="fa-solid fa-handshake"></i>
              <span class="tab-label-desktop">Patrocínios</span>
              <span class="tab-label-mobile">Apoio</span>
              <span v-if="proposals.length > 0" class="tab-badge badge-gold">{{ proposals.length }}</span>
            </button>

            <button
              class="tab-btn font-slab"
              :class="{ active: activeTab === 'checkin' }"
              @click="activeTab = 'checkin'"
            >
              <i class="fa-solid fa-clipboard-check"></i>
              <span class="tab-label-desktop">Check-in Prova</span>
              <span class="tab-label-mobile">Check-in</span>
              <span class="tab-badge badge-green">{{ checkedInCount }}</span>
            </button>
          </div>
        </nav>
      </div>

      <!-- Main Body Container -->
      <main class="staff-content-body">
        <div class="staff-page-content-wrapper">
          <div v-if="athletesError" class="error-banner font-condensed" role="alert">
            {{ athletesError }}
            <button type="button" class="btn-vintage btn-sm" @click="fetchStaffAthletes()">Tentar novamente</button>
          </div>
          <!-- TAB 1: VISÃO GERAL -->
          <StaffTeamPanel v-if="activeTab === 'team'" ref="teamPanel" />
          <section v-if="activeTab === 'overview'" class="tab-pane animate-fade-in">
            <div class="kpi-grid">
              <div class="kpi-card vintage-card" data-testid="confirmed-kpi">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">ATLETAS CONFIRMADOS (PAGANTES)</span>
                  <i class="fa-solid fa-circle-check kpi-icon text-green"></i>
                </div>
                <div class="kpi-value font-slab text-green">{{ athleteSummary ? athleteSummary.confirmedCount : '—' }}</div>
                <p class="kpi-desc font-condensed">Inscrições com pagamento confirmado.</p>
              </div>
              <div class="kpi-card vintage-card" data-testid="revenue-kpi">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">TOTAL RECEBIDO EM INSCRIÇÕES</span>
                  <i class="fa-solid fa-brazilian-real-sign kpi-icon text-green"></i>
                </div>
                <div class="kpi-value kpi-money font-slab text-green">{{ athleteSummary ? formatMoney(athleteSummary.totalReceivedCents) : '—' }}</div>
                <p class="kpi-desc font-condensed">Valor das inscrições pagas, após cupons e sem acréscimos do checkout.</p>
                <div v-if="athleteSummary?.confirmedWithoutPaymentCount" class="kpi-footer font-condensed">
                  {{ athleteSummary.confirmedWithoutPaymentCount }} pagante(s) sem pedido pago registrado; seus valores não estão incluídos no total.
                </div>
              </div>
              <!-- Card 1: Inscrições -->
              <div class="kpi-card vintage-card">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">ATLETAS CADASTRADOS</span>
                  <i class="fa-solid fa-users kpi-icon"></i>
                </div>
                <div class="kpi-value font-slab">{{ athletesError || athletesLoading ? '—' : athletes.length }}</div>
                <div class="kpi-footer font-condensed">
                  Todos os cadastros, incluindo inscrições ainda não pagas.
                </div>
              </div>

              <!-- Card 2: Cervejeiros vs Sem Álcool -->
              <div class="kpi-card vintage-card">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">CONSUMO DE CHOPP</span>
                  <i class="fa-solid fa-beer-mug-empty kpi-icon text-amber"></i>
                </div>
                <div class="kpi-split-stat font-slab">
                  <div class="stat-col">
                    <span class="stat-num text-amber">{{ drinkersCount }}</span>
                    <span class="stat-lbl font-condensed">Bebem Chopp</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-col">
                    <span class="stat-num text-muted">{{ nonDrinkersCount }}</span>
                    <span class="stat-lbl font-condensed">Sem Álcool</span>
                  </div>
                </div>
                <div class="kpi-footer font-condensed">
                  Estimativa: {{ drinkersCount * 4 }} chopps na prova + resenha
                </div>
              </div>

              <!-- Card 3: Modalidades -->
              <div class="kpi-card vintage-card">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">MODALIDADES</span>
                  <i class="fa-solid fa-shoe-prints kpi-icon text-green"></i>
                </div>
                <div class="kpi-split-stat font-slab">
                  <div class="stat-col">
                    <span class="stat-num">{{ runnersCount }}</span>
                    <span class="stat-lbl font-condensed">Corrida (6,37 km)</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-col">
                    <span class="stat-num">{{ walkersCount }}</span>
                    <span class="stat-lbl font-condensed">Caminhada</span>
                  </div>
                </div>
                <div class="kpi-footer font-condensed">
                  Largadas simultâneas às 10:00
                </div>
              </div>

              <!-- Card 4: Fila de Espera -->
              <div class="kpi-card vintage-card">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">LISTA DE ESPERA</span>
                  <i class="fa-solid fa-hourglass-half kpi-icon text-gold"></i>
                </div>
                <div class="kpi-value font-slab text-gold">{{ activeWaitlist.length }}</div>
                <p class="kpi-desc font-condensed">Atletas na fila aguardando vagas por desistência.</p>
                <div class="kpi-footer">
                  <button
                    v-if="activeWaitlist.length > 0"
                    class="btn-vintage btn-sm font-condensed"
                    @click="activeTab = 'waitlist'"
                  >
                    Ver Fila de Espera →
                  </button>
                </div>
              </div>

              <!-- Card: Status das Inscrições Oficiais & Pagamentos -->
              <div class="kpi-card vintage-card span-2">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">PIPELINE DE INSCRIÇÕES & PAGAMENTOS</span>
                  <i class="fa-solid fa-receipt kpi-icon text-gold"></i>
                </div>
                <div class="sponsor-pipeline-summary">
                  <div class="pipe-step">
                    <span class="pipe-num text-muted">{{ athletesPreRegistrationCount }}</span>
                    <span class="pipe-lbl font-condensed">Pré-Inscrições</span>
                  </div>
                  <i class="fa-solid fa-arrow-right pipe-arrow"></i>
                  <div class="pipe-step step-approved">
                    <span class="pipe-num text-amber">{{ athletesPendingPaymentCount }}</span>
                    <span class="pipe-lbl font-condensed">Aguardando Pagamento</span>
                  </div>
                  <i class="fa-solid fa-arrow-right pipe-arrow"></i>
                  <div class="pipe-step step-finished">
                    <span class="pipe-num text-green">{{ athletesCompletedCount }}</span>
                    <span class="pipe-lbl font-condensed">Concluídos (Pagos)</span>
                  </div>
                </div>
                <div class="kpi-footer font-condensed">
                  <button class="btn-vintage btn-sm" @click="activeTab = 'athletes'">Gerenciar Inscrições →</button>
                </div>
              </div>

              <!-- Card 5: Patrocínios Pipeline -->
              <div class="kpi-card vintage-card span-2">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">PIPELINE COMERCIAL DE PATROCÍNIOS</span>
                  <i class="fa-solid fa-handshake kpi-icon"></i>
                </div>
                <div class="sponsor-pipeline-summary">
                  <div class="pipe-step">
                    <span class="pipe-num">{{ proposalsPendingCount }}</span>
                    <span class="pipe-lbl font-condensed">Pendentes</span>
                  </div>
                  <i class="fa-solid fa-arrow-right pipe-arrow"></i>
                  <div class="pipe-step step-approved">
                    <span class="pipe-num text-amber">{{ proposalsApprovedCount }}</span>
                    <span class="pipe-lbl font-condensed">Aprovados (Wait Payment)</span>
                  </div>
                  <i class="fa-solid fa-arrow-right pipe-arrow"></i>
                  <div class="pipe-step step-finished">
                    <span class="pipe-num text-green">{{ proposalsFinishedCount }}</span>
                    <span class="pipe-lbl font-condensed">Concluídos / Fechados</span>
                  </div>
                  <i class="fa-solid fa-arrow-right pipe-arrow"></i>
                  <div class="pipe-step step-rejected">
                    <span class="pipe-num text-danger">{{ proposalsRejectedCount }}</span>
                    <span class="pipe-lbl font-condensed">Recusados</span>
                  </div>
                </div>
                <div class="kpi-footer font-condensed">
                  <button class="btn-vintage btn-sm" @click="activeTab = 'sponsors'">Gerenciar Propostas →</button>
                </div>
              </div>
            </div>
          </section>

          <!-- TAB 2: ATLETAS CONFIRMADOS -->
          <section v-if="activeTab === 'athletes'" class="tab-pane animate-fade-in">
            <!-- Toast de Atualização de Status -->
            <div v-if="paymentStatusToast" class="payment-toast-banner font-condensed animate-slide-up">
              <i class="fa-solid fa-circle-check"></i>
              <span>{{ paymentStatusToast }}</span>
            </div>

            <!-- Control Bar -->
            <div class="pane-toolbar">
              <div class="search-wrap">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  v-model="athleteSearch"
                  placeholder="Buscar atleta por nome, apelido ou tel..."
                  class="form-input search-input font-condensed"
                />
                <button v-if="athleteSearch" class="btn-clear-search" @click="athleteSearch = ''">✕</button>
              </div>

              <!-- Desktop Pill Filters (Ocultado em telas pequenas) -->
              <div class="filter-pills font-condensed desktop-filters">
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterModality === 'all' }"
                  @click="athleteFilterModality = 'all'"
                >
                  Todas Modalidades
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterModality === 'corrida' }"
                  @click="athleteFilterModality = 'corrida'"
                >
                  🏃 Corrida
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterModality === 'caminhada' }"
                  @click="athleteFilterModality = 'caminhada'"
                >
                  🚶 Caminhada
                </button>
                <button class="pill-btn" :class="{ active: athleteFilterModality === 'kids' }" @click="athleteFilterModality = 'kids'">Corrida Kids</button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterBeer === 'all' }"
                  @click="athleteFilterBeer = 'all'"
                >
                  Todos Chopp
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterBeer === 'drinks' }"
                  @click="athleteFilterBeer = 'drinks'"
                >
                  🍺 Chopp
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterBeer === 'no-drinks' }"
                  @click="athleteFilterBeer = 'no-drinks'"
                >
                  🚫 Sem Álcool
                </button>

                <!-- Filtros de Status de Pagamento -->
                <button
                  class="pill-btn pill-status"
                  :class="{ active: athleteFilterPaymentStatus === 'all' }"
                  @click="athleteFilterPaymentStatus = 'all'"
                >
                  Todos Status
                </button>
                <button
                  class="pill-btn pill-pending"
                  :class="{ active: athleteFilterPaymentStatus === 'pending_payment' }"
                  @click="athleteFilterPaymentStatus = 'pending_payment'"
                >
                  ⏳ Aguardando Pgto ({{ athletesPendingPaymentCount }})
                </button>
                <button
                  class="pill-btn pill-completed"
                  :class="{ active: athleteFilterPaymentStatus === 'completed' }"
                  @click="athleteFilterPaymentStatus = 'completed'"
                >
                  🟢 Concluídos ({{ athletesCompletedCount }})
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: athleteFilterPaymentStatus === 'pre_registration' }"
                  @click="athleteFilterPaymentStatus = 'pre_registration'"
                >
                  ⚪ Pré-Inscrição ({{ athletesPreRegistrationCount }})
                </button>
              </div>

              <!-- Mobile Filter Dropdowns (100% largura, Zero Scroll Horizontal) -->
              <div class="mobile-athlete-filters-grid font-condensed">
                <div class="mobile-select-group">
                  <label class="mobile-select-label"><i class="fa-solid fa-file-invoice-dollar"></i> Status Pgto:</label>
                  <select v-model="athleteFilterPaymentStatus" class="mobile-filter-dropdown">
                    <option value="all">Todos os Status ({{ athletes.length }})</option>
                    <option value="pending_payment">⏳ Aguardando Pgto ({{ athletesPendingPaymentCount }})</option>
                    <option value="completed">🟢 Concluídos ({{ athletesCompletedCount }})</option>
                    <option value="pre_registration">⚪ Pré-Inscrição ({{ athletesPreRegistrationCount }})</option>
                  </select>
                </div>
                <div class="mobile-select-group">
                  <label class="mobile-select-label"><i class="fa-solid fa-person-running"></i> Modalidade:</label>
                  <select v-model="athleteFilterModality" class="mobile-filter-dropdown">
                    <option value="all">Todas modalidades</option>
                    <option value="corrida">🏃 Corrida (6,37 km)</option>
                    <option value="caminhada">🚶 Caminhada</option>
                    <option value="kids">Corrida Kids</option>
                  </select>
                </div>
                <div class="mobile-select-group">
                  <label class="mobile-select-label"><i class="fa-solid fa-beer-mug-empty"></i> Chopp:</label>
                  <select v-model="athleteFilterBeer" class="mobile-filter-dropdown">
                    <option value="all">Todos (Com e Sem)</option>
                    <option value="drinks">🍺 Chopp Gelado</option>
                    <option value="no-drinks">🚫 Sem Álcool</option>
                  </select>
                </div>
              </div>

              <div class="toolbar-actions">
                <button class="btn-vintage btn-sm font-slab" @click="openAddAthleteModal">
                  <i class="fa-solid fa-user-plus"></i> Novo Atleta
                </button>
                <button class="btn-vintage btn-sm btn-export font-slab" @click="exportAthletesCSV">
                  <i class="fa-solid fa-file-csv"></i> Exportar CSV
                </button>
              </div>
            </div>

            <!-- Athletes Table -->
            <div class="table-container vintage-card">
              <div class="table-summary-bar font-condensed">
                <span>Exibindo <strong>{{ filteredAthletes.length }}</strong> de <strong>{{ athletes.length }}</strong> inscritos</span>
                <span>Vagas adultas: <strong>{{ maxAthletes }}</strong> · Vagas Kids: <strong>{{ athleteSummary?.kidsCapacity ?? 0 }}</strong></span>
              </div>

              <div class="table-responsive-wrapper">
                <table class="data-table">
                  <thead>
                    <tr class="font-slab">
                      <th style="width: 50px;">#</th>
                      <th>Atleta</th>
                      <th>WhatsApp</th>
                      <th>Modalidade</th>
                      <th>Chopp</th>
                      <th style="min-width: 170px;">Status Pagamento</th>
                      <th>Check-in</th>
                      <th style="text-align: right;">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredAthletes.length === 0">
                      <td colspan="8" class="table-empty font-condensed">
                        Nenhum atleta encontrado com os filtros selecionados.
                      </td>
                    </tr>
                    <tr v-for="(athlete, index) in filteredAthletes" :key="athlete.id">
                      <td class="cell-num font-slab">{{ index + 1 }}</td>
                      <td>
                        <div class="athlete-name-cell">
                          <div class="font-slab athlete-name">{{ athlete.name }}</div>
                          <div v-if="athlete.nickname" class="athlete-nick font-condensed">"{{ athlete.nickname }}"</div>
                          <div v-if="athlete.skewerChoice" class="athlete-kit-info font-condensed text-muted">
                            🍢 Espetinhos: <strong>{{ athlete.skewerChoice }}</strong>
                          </div>
                          <div v-if="athlete.guardianName" class="athlete-kit-info font-condensed">Responsável: <strong>{{ athlete.guardianName }}</strong> · Nascimento: {{ athlete.birthDate?.split('-').reverse().join('/') }}</div>
                          <div v-if="athlete.shirtSize || athlete.modality === 'kids'" class="athlete-kit-info font-condensed text-muted">
                            👕 Camiseta: <strong>{{ formatShirtSelection(athlete.shirtModel, athlete.shirtSize, athlete.modality) }}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a
                          v-if="athlete.phone"
                          :href="getAthleteWhatsAppLink(athlete)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="whatsapp-link font-condensed"
                          title="Chamar no WhatsApp"
                        >
                          <i class="fa-brands fa-whatsapp"></i>
                          <span>{{ athlete.phone }}</span>
                        </a>
                        <span v-else class="text-muted font-condensed">-</span>
                      </td>
                      <td>
                        <span
                          class="tag-badge font-condensed"
                          :class="athlete.modality === 'caminhada' ? 'tag-walk' : 'tag-run'"
                        >
                          {{ athlete.modality === 'kids' ? 'Corrida Kids' : athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
                        </span>
                      </td>
                      <td>
                        <span
                          class="tag-badge font-condensed"
                          :class="athlete.drinksBeer ? 'tag-beer' : 'tag-nobeer'"
                        >
                          {{ athlete.drinksBeer ? '🍺 Chopp' : '🚫 Não' }}
                        </span>
                      </td>

                      <!-- COLUNA STATUS PAGAMENTO (STAFF MANAGEMENT) -->
                      <td>
                        <div class="status-cell-wrap font-condensed">
                          <template v-if="athlete.paymentStatus === 'completed'">
                            <span class="tag-badge tag-paid" title="Pagamento confirmado">
                              <i class="fa-solid fa-circle-check"></i> Concluído (Pago)
                            </span>
                            <button
                              type="button"
                              class="btn-mini-status text-muted"
                              @click="handleTogglePaymentStatus(athlete)"
                              title="Reverter para Aguardando Pagamento"
                            >
                              <i class="fa-solid fa-rotate-left"></i>
                            </button>
                          </template>

                          <template v-else-if="athlete.paymentStatus === 'pending_payment' || athlete.acceptedTermsAt">
                            <span class="tag-badge tag-wait-pay" title="Inscrição preenchida, aguardando validação do PIX">
                              <i class="fa-solid fa-hourglass-half"></i> Aguardando Pgto
                            </span>
                            <button
                              type="button"
                              class="btn-mini-approve font-condensed font-bold"
                              @click="handleConfirmPayment(athlete)"
                              title="Validar comprovante e marcar como CONCLUÍDO"
                            >
                              <i class="fa-solid fa-check"></i> Concluir
                            </button>
                          </template>

                          <template v-else>
                            <span class="tag-badge tag-pre-only" title="Apenas pré-inscrição (ainda não preencheu dados oficiais)">
                              <i class="fa-regular fa-clock"></i> Pré-Inscrição
                            </span>
                          </template>
                        </div>
                      </td>

                      <td>
                        <button
                          class="checkin-badge-btn font-condensed"
                          :class="{ 'is-checked': athlete.isCheckedIn }"
                          @click="handleCheckIn(athlete.id, !athlete.isCheckedIn)"
                          :title="athlete.isCheckedIn ? 'Kit Entregue! Clique para desmarcar' : 'Clique para registrar entrega do kit'"
                        >
                          <i :class="athlete.isCheckedIn ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
                          {{ athlete.isCheckedIn ? 'Kit Retirado' : 'Pendente' }}
                        </button>
                      </td>
                      <td style="text-align: right;">
                        <div class="action-buttons-cell">
                          <a
                            :href="getAthleteWhatsAppLink(athlete)"
                            target="_blank"
                            class="btn-row-action btn-wa"
                            title="Enviar mensagem via WhatsApp"
                          >
                            <i class="fa-brands fa-whatsapp"></i>
                          </a>
                          <button
                            class="btn-row-action btn-delete"
                            @click="promptDeleteAthlete(athlete)"
                            title="Remover atleta da prova (requer senha)"
                          >
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile Athletes Cards List (Exibido apenas em mobile <= 768px) -->
              <div class="mobile-cards-list mobile-athletes-list">
                <div v-if="filteredAthletes.length === 0" class="table-empty font-condensed">
                  Nenhum atleta encontrado com os filtros selecionados.
                </div>
                <div
                  v-for="(athlete, index) in filteredAthletes"
                  :key="athlete.id"
                  class="mobile-data-card"
                  :class="{ 'card-checked-highlight': athlete.isCheckedIn }"
                >
                  <div class="mobile-card-top-row">
                    <div class="mobile-card-identity">
                      <span class="mobile-pos-badge font-slab">#{{ index + 1 }}</span>
                      <div>
                        <div class="mobile-athlete-name font-slab">{{ athlete.name }}</div>
                        <div v-if="athlete.nickname" class="athlete-nick font-condensed">"{{ athlete.nickname }}"</div>
                        <div v-if="athlete.skewerChoice" class="athlete-kit-info font-condensed text-muted">
                          🍢 Espetinhos: <strong>{{ athlete.skewerChoice }}</strong>
                        </div>
                        <div v-if="athlete.guardianName" class="athlete-kit-info font-condensed">Responsável: <strong>{{ athlete.guardianName }}</strong> · Nascimento: {{ athlete.birthDate?.split('-').reverse().join('/') }}</div>
                          <div v-if="athlete.shirtSize || athlete.modality === 'kids'" class="athlete-kit-info font-condensed text-muted">
                          👕 Camiseta: <strong>{{ formatShirtSelection(athlete.shirtModel, athlete.shirtSize, athlete.modality) }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="mobile-card-quick-actions">
                      <a
                        v-if="athlete.phone"
                        :href="getAthleteWhatsAppLink(athlete)"
                        target="_blank"
                        class="btn-row-action btn-wa"
                        title="Enviar mensagem via WhatsApp"
                      >
                        <i class="fa-brands fa-whatsapp"></i>
                      </a>
                      <button
                        class="btn-row-action btn-delete"
                        @click="promptDeleteAthlete(athlete)"
                        title="Remover atleta da prova (requer senha)"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  <div class="mobile-card-pills-row font-condensed">
                    <span
                      class="tag-badge"
                      :class="athlete.modality === 'caminhada' ? 'tag-walk' : 'tag-run'"
                    >
                      {{ athlete.modality === 'kids' ? 'Corrida Kids' : athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
                    </span>
                    <span
                      class="tag-badge"
                      :class="athlete.drinksBeer ? 'tag-beer' : 'tag-nobeer'"
                    >
                      {{ athlete.drinksBeer ? '🍺 Chopp' : '🚫 Sem Álcool' }}
                    </span>
                    <span v-if="athlete.phone" class="mobile-phone-text">
                      <i class="fa-solid fa-phone"></i> {{ athlete.phone }}
                    </span>
                  </div>

                  <!-- Linha de Status de Pagamento no Mobile -->
                  <div class="mobile-card-status-row font-condensed">
                    <div class="mobile-status-left">
                      <span class="mobile-status-label">Status:</span>
                      <span v-if="athlete.paymentStatus === 'completed'" class="tag-badge tag-paid">
                        <i class="fa-solid fa-circle-check"></i> Concluído (Pago)
                      </span>
                      <span v-else-if="athlete.paymentStatus === 'pending_payment' || athlete.acceptedTermsAt" class="tag-badge tag-wait-pay">
                        <i class="fa-solid fa-hourglass-half"></i> Aguardando Pgto
                      </span>
                      <span v-else class="tag-badge tag-pre-only">
                        <i class="fa-regular fa-clock"></i> Pré-Inscrição
                      </span>
                    </div>

                    <button
                      v-if="athlete.paymentStatus === 'pending_payment' || (athlete.acceptedTermsAt && athlete.paymentStatus !== 'completed')"
                      type="button"
                      class="mobile-approve-btn font-slab"
                      @click="handleConfirmPayment(athlete)"
                    >
                      <i class="fa-solid fa-check"></i> Aprovar Pagamento (Concluir)
                    </button>
                  </div>

                  <div class="mobile-card-action-bar">
                    <button
                      class="mobile-checkin-btn font-condensed"
                      :class="{ 'is-checked': athlete.isCheckedIn }"
                      @click="handleCheckIn(athlete.id, !athlete.isCheckedIn)"
                    >
                      <i :class="athlete.isCheckedIn ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
                      {{ athlete.isCheckedIn ? 'Kit Retirado (OK)' : 'Pendente de Entrega' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- TAB 3: LISTA DE ESPERA (WAITLIST) -->
          <section v-if="activeTab === 'waitlist'" class="tab-pane animate-fade-in">
            <div class="pane-toolbar">
              <div class="waitlist-banner-info font-condensed">
                <i class="fa-solid fa-circle-info"></i>
                <span>
                  Para liberar a inscrição de um atleta da fila, altere o status para “Convocado — inscrição liberada”. A convocação não reserva a vaga.
                </span>
              </div>

              <div class="toolbar-actions">
                <label class="font-condensed">
                  Exibir:
                  <select v-model="waitlistView" class="status-select font-condensed" aria-label="Visualiza??o da lista de espera">
                    <option value="active">Fila ativa</option>
                    <option value="history">Hist?rico</option>
                  </select>
                </label>
                <button class="btn-vintage btn-sm btn-export font-slab" @click="exportWaitlistCSV">
                  <i class="fa-solid fa-file-csv"></i> Exportar Waitlist
                </button>
              </div>
            </div>

            <div class="table-container vintage-card">
              <div class="table-responsive-wrapper">
                <table class="data-table">
                  <thead>
                    <tr class="font-slab">
                      <th style="width: 70px;">Posição</th>
                      <th>Atleta Interessado</th>
                      <th>WhatsApp</th>
                      <th>Modalidade</th>
                      <th>Chopp</th>
                      <th>Status</th>
                      <th>Data/Hora</th>
                      <th style="text-align: right;">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="visibleWaitlist.length === 0">
                      <td colspan="8" class="table-empty font-condensed">
                        A lista de espera está vazia no momento.
                      </td>
                    </tr>
                    <tr v-for="(item, idx) in visibleWaitlist" :key="item.id">
                      <td class="cell-num font-slab">
                        <span class="waitlist-rank-badge">#{{ idx + 1 }}</span>
                      </td>
                      <td>
                        <div class="athlete-name-cell">
                          <div class="font-slab athlete-name">{{ item.name }}</div>
                          <div v-if="item.nickname" class="athlete-nick font-condensed">"{{ item.nickname }}"</div>
                        </div>
                      </td>
                      <td>
                        <a
                          v-if="item.phone"
                          :href="getWaitlistWhatsAppLink(item, idx + 1)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="whatsapp-link font-condensed"
                          title="Chamar no WhatsApp sobre vaga"
                        >
                          <i class="fa-brands fa-whatsapp"></i>
                          <span>{{ item.phone }}</span>
                        </a>
                      </td>
                      <td>
                        <span class="tag-badge font-condensed" :class="item.modality === 'caminhada' ? 'tag-walk' : 'tag-run'">
                          {{ item.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
                        </span>
                      </td>
                      <td>
                        <span class="tag-badge font-condensed" :class="item.drinksBeer ? 'tag-beer' : 'tag-nobeer'">
                          {{ item.drinksBeer ? '🍺 Chopp' : '🚫 Não' }}
                        </span>
                      </td>
                      <td>
                        <select
                          :value="item.status"
                          @change="handleWaitlistStatusChange(item, $event)"
                          class="status-select font-condensed"
                          :class="'status-' + item.status"
                        >
                          <option value="waiting">⏳ Aguardando</option>
                          <option value="called">📞 Convocado — inscrição liberada</option>
                          <option value="registered">✅ Inscrito / Promovido</option>
                          <option value="cancelled">❌ Desistiu / Cancelado</option>
                        </select>
                      </td>
                      <td class="font-condensed text-muted cell-date">
                        {{ formatDate(item.createdAt) }}
                      </td>
                      <td style="text-align: right;">
                        <div class="action-buttons-cell">
                          <button
                            v-if="item.status !== 'registered'"
                            class="btn-promote font-slab"
                            @click="confirmPromoteAthlete(item)"
                            title="Promover para atleta confirmado"
                          >
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Promover
                          </button>
                          <a
                            :href="getWaitlistWhatsAppLink(item, idx + 1)"
                            target="_blank"
                            class="btn-row-action btn-wa"
                            title="Avisar no WhatsApp sobre vaga liberada"
                          >
                            <i class="fa-brands fa-whatsapp"></i>
                          </a>
                          <button
                            class="btn-row-action btn-delete"
                            @click="promptDeleteWaitlist(item)"
                            title="Remover da lista de espera (requer senha)"
                          >
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile Waitlist Cards List (Exibido apenas em mobile <= 768px) -->
              <div class="mobile-cards-list mobile-waitlist-list">
                <div v-if="visibleWaitlist.length === 0" class="table-empty font-condensed">
                  A lista de espera está vazia no momento.
                </div>
                <div
                  v-for="(item, idx) in visibleWaitlist"
                  :key="item.id"
                  class="mobile-data-card"
                >
                  <div class="mobile-card-top-row">
                    <div class="mobile-card-identity">
                      <span class="waitlist-rank-badge font-slab">#{{ idx + 1 }}</span>
                      <div>
                        <div class="mobile-athlete-name font-slab">{{ item.name }}</div>
                        <div v-if="item.nickname" class="athlete-nick font-condensed">"{{ item.nickname }}"</div>
                      </div>
                    </div>

                    <div class="mobile-card-quick-actions">
                      <a
                        v-if="item.phone"
                        :href="getWaitlistWhatsAppLink(item, idx + 1)"
                        target="_blank"
                        class="btn-row-action btn-wa"
                        title="Avisar no WhatsApp sobre vaga liberada"
                      >
                        <i class="fa-brands fa-whatsapp"></i>
                      </a>
                      <button
                        class="btn-row-action btn-delete"
                        @click="promptDeleteWaitlist(item)"
                        title="Remover da lista de espera (requer senha)"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  <div class="mobile-card-pills-row font-condensed">
                    <span class="tag-badge" :class="item.modality === 'caminhada' ? 'tag-walk' : 'tag-run'">
                      {{ item.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
                    </span>
                    <span class="tag-badge" :class="item.drinksBeer ? 'tag-beer' : 'tag-nobeer'">
                      {{ item.drinksBeer ? '🍺 Chopp' : '🚫 Não' }}
                    </span>
                    <span v-if="item.phone" class="mobile-phone-text">
                      <i class="fa-solid fa-phone"></i> {{ item.phone }}
                    </span>
                  </div>

                  <div class="mobile-card-status-row font-condensed">
                    <label class="mobile-status-lbl">Status da Fila:</label>
                    <select
                      :value="item.status"
                      @change="handleWaitlistStatusChange(item, $event)"
                      class="status-select font-condensed"
                      :class="'status-' + item.status"
                    >
                      <option value="waiting">⏳ Aguardando</option>
                      <option value="called">📞 Convocado — inscrição liberada</option>
                      <option value="registered">✅ Inscrito / Promovido</option>
                      <option value="cancelled">❌ Desistiu / Cancelado</option>
                    </select>
                  </div>

                  <div class="mobile-card-footer-split font-condensed">
                    <span class="text-muted cell-date">
                      <i class="fa-regular fa-clock"></i> {{ formatDate(item.createdAt) }}
                    </span>
                    <button
                      v-if="item.status !== 'registered'"
                      class="btn-promote font-slab"
                      @click="confirmPromoteAthlete(item)"
                      title="Promover para atleta confirmado"
                    >
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> Promover Vaga
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- TAB 4: PATROCÍNIOS & MARCAS NO SITE -->
          <section v-if="activeTab === 'sponsors'" class="tab-pane animate-fade-in">
            <!-- Sub-tab switcher -->
            <div class="sponsor-sub-nav font-slab">
              <button
                type="button"
                class="sub-tab-btn"
                :class="{ active: sponsorSubTab === 'proposals' }"
                @click="sponsorSubTab = 'proposals'"
              >
                <i class="fa-solid fa-file-invoice-dollar"></i> Propostas Recebidas ({{ proposals.length }})
              </button>
              <button
                type="button"
                class="sub-tab-btn"
                :class="{ active: sponsorSubTab === 'official' }"
                @click="sponsorSubTab = 'official'"
              >
                <i class="fa-solid fa-globe"></i> Patrocinadores no Site Oficial ({{ allSponsors.length }})
              </button>
            </div>

            <!-- Toast de publicação automática -->
            <div v-if="publishToastMessage" class="publish-toast font-condensed animate-slide-up">
              <div class="toast-content">
                <i class="fa-solid fa-circle-check"></i>
                <span>{{ publishToastMessage }}</span>
              </div>
              <button class="toast-close-btn" @click="publishToastMessage = ''">✕</button>
            </div>

            <!-- SUB-VIEW 1: PROPOSTAS RECEBIDAS (PIPELINE) -->
            <div v-if="sponsorSubTab === 'proposals'" class="tab-subpane">
              <div class="pane-toolbar">
                <!-- Desktop Pill Filters (Ocultado em telas pequenas) -->
                <div class="sponsor-filters font-condensed desktop-filters">
                  <span class="filter-label">Filtrar por Status:</span>
                  <button
                    class="pill-btn"
                    :class="{ active: sponsorFilterStatus === 'all' }"
                    @click="sponsorFilterStatus = 'all'"
                  >
                    Todos ({{ proposals.length }})
                  </button>
                  <button
                    class="pill-btn pill-pending"
                    :class="{ active: sponsorFilterStatus === 'pending' }"
                    @click="sponsorFilterStatus = 'pending'"
                  >
                    Pendente ({{ proposalsPendingCount }})
                  </button>
                  <button
                    class="pill-btn pill-approved"
                    :class="{ active: sponsorFilterStatus === 'approved' }"
                    @click="sponsorFilterStatus = 'approved'"
                  >
                    Aprovado / Wait Payment ({{ proposalsApprovedCount }})
                  </button>
                  <button
                    class="pill-btn pill-finished"
                    :class="{ active: sponsorFilterStatus === 'finished' }"
                    @click="sponsorFilterStatus = 'finished'"
                  >
                    Concluído ({{ proposalsFinishedCount }})
                  </button>
                  <button
                    class="pill-btn pill-rejected"
                    :class="{ active: sponsorFilterStatus === 'rejected' }"
                    @click="sponsorFilterStatus = 'rejected'"
                  >
                    Recusado ({{ proposalsRejectedCount }})
                  </button>
                </div>

                <!-- Mobile Filter Dropdown (100% largura, Zero Scroll Horizontal) -->
                <div class="mobile-filter-select-wrap font-condensed">
                  <label for="sponsor-status-filter" class="mobile-select-label">
                    <i class="fa-solid fa-filter"></i> Filtrar por Status:
                  </label>
                  <select
                    id="sponsor-status-filter"
                    v-model="sponsorFilterStatus"
                    class="mobile-filter-dropdown"
                  >
                    <option value="all">🔍 Todos os Status ({{ proposals.length }})</option>
                    <option value="pending">⏳ Pendente / Em Análise ({{ proposalsPendingCount }})</option>
                    <option value="approved">💵 Aprovado / Wait Payment ({{ proposalsApprovedCount }})</option>
                    <option value="finished">✅ Concluído / Fechado ({{ proposalsFinishedCount }})</option>
                    <option value="rejected">❌ Recusado ({{ proposalsRejectedCount }})</option>
                  </select>
                </div>

                <div class="toolbar-actions">
                  <button class="btn-vintage btn-sm btn-export font-slab" @click="exportProposalsCSV">
                    <i class="fa-solid fa-file-csv"></i> Exportar Relatório
                  </button>
                </div>
              </div>

              <!-- Cards Grid for Sponsorship Proposals -->
              <div class="sponsors-grid">
                <div v-if="filteredProposals.length === 0" class="empty-box vintage-card span-all font-condensed">
                  Nenhuma proposta de patrocínio encontrada para o filtro selecionado.
                </div>

                <div
                  v-for="prop in filteredProposals"
                  :key="prop.id"
                  class="sponsor-card vintage-card"
                  :class="'border-' + prop.status"
                >
                  <!-- Card Header -->
                  <div class="sponsor-card-top">
                    <div class="sponsor-brand-box">
                      <img
                        v-if="prop.logoUrl"
                        :src="prop.logoUrl"
                        :alt="prop.companyName"
                        class="sponsor-card-logo"
                      />
                      <div v-else class="sponsor-logo-placeholder">
                        <i class="fa-solid fa-building"></i>
                      </div>
                      <div>
                        <h3 class="font-slab sponsor-company">{{ prop.companyName }}</h3>
                        <div class="font-condensed sponsor-contact">
                          <i class="fa-solid fa-user-tie"></i> {{ prop.contactName }}
                        </div>
                      </div>
                    </div>

                    <!-- Status Selector -->
                    <div class="sponsor-status-box">
                      <label class="status-lbl font-condensed">Status:</label>
                      <select
                        v-model="prop.status"
                        @change="handleProposalStatusChange(prop, prop.status)"
                        class="sponsor-status-select font-condensed"
                        :class="'status-' + prop.status"
                      >
                        <option value="pending">⏳ Pendente / Em Análise</option>
                        <option value="approved">💵 Aprovado (Wait Payment)</option>
                        <option value="finished">✅ Concluído / Fechado</option>
                        <option value="rejected">❌ Recusado</option>
                      </select>
                    </div>
                  </div>

                  <!-- Card Body -->
                  <div class="sponsor-details-list font-condensed">
                    <div class="detail-row">
                      <span class="detail-name">Formato:</span>
                      <span class="detail-val font-bold">{{ formatSponsorshipType(prop.sponsorshipType) }}</span>
                    </div>

                    <div v-if="prop.amount" class="detail-row">
                      <span class="detail-name">Valor:</span>
                      <span class="detail-val text-green font-bold">{{ prop.amount }}</span>
                    </div>

                    <div v-if="prop.itemsDescription" class="detail-row">
                      <span class="detail-name">Itens / Brindes / Estrutura:</span>
                      <span class="detail-val">{{ prop.itemsDescription }}</span>
                    </div>

                    <div v-if="prop.activations && prop.activations.length > 0" class="detail-row">
                      <span class="detail-name">Ativações:</span>
                      <div class="activations-tags">
                        <span v-for="act in prop.activations" :key="act" class="act-tag">
                          • {{ act }}
                        </span>
                      </div>
                    </div>

                    <div v-if="prop.notes" class="detail-notes">
                      <span class="detail-name">Observações:</span>
                      <p class="notes-text">"{{ prop.notes }}"</p>
                    </div>

                    <div v-if="prop.websiteInstagram" class="detail-row">
                      <span class="detail-name">Link / Perfil:</span>
                      <span class="detail-val">{{ prop.websiteInstagram }}</span>
                    </div>

                    <!-- Live Site Status Badge -->
                    <div v-if="prop.status === 'finished'" class="published-site-badge font-condensed">
                      <i class="fa-solid fa-circle-check"></i>
                      <span>Publicado no carrossel de patrocinadores da Landing Page</span>
                    </div>
                  </div>

                  <!-- Card Footer -->
                  <div class="sponsor-card-footer">
                    <span class="sponsor-date font-condensed text-muted">
                      Recebido em: {{ formatDate(prop.createdAt) }}
                    </span>

                    <div class="sponsor-footer-actions">
                      <button
                        v-if="prop.status === 'finished' || prop.status === 'approved'"
                        class="btn-vintage btn-sm btn-sync-site font-condensed"
                        @click="handleManualPublishToSite(prop)"
                        title="Enviar ou sincronizar esta marca no carrossel da Landing Page"
                      >
                        <i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar Site
                      </button>

                      <a
                        :href="getSponsorWhatsAppLink(prop)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-vintage btn-sm btn-wa-full font-condensed"
                      >
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                      </a>
                      <button
                        class="btn-row-action btn-delete"
                        @click="promptDeleteProposal(prop)"
                        title="Excluir proposta (requer senha)"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SUB-VIEW 2: PATROCINADORES OFICIAIS NO SITE (TABELA SPONSORS) -->
            <div v-else class="tab-subpane animate-fade-in">
              <div class="pane-toolbar">
                <div class="official-sponsors-info font-condensed">
                  <i class="fa-solid fa-circle-info"></i>
                  <span>
                    Marcas atualmente configuradas na tabela <strong>sponsors</strong> exibidas no carrossel oficial da Landing Page.
                  </span>
                </div>

                <div class="toolbar-actions">
                  <button class="btn-vintage btn-sm font-slab" @click="openAddOfficialSponsorModal">
                    <i class="fa-solid fa-plus"></i> Nova Marca no Site
                  </button>
                </div>
              </div>

              <!-- Official Sponsors Table -->
              <div class="table-container vintage-card">
                <div class="table-summary-bar font-condensed">
                  <span>Total de marcas cadastradas: <strong>{{ allSponsors.length }}</strong> (<strong>{{ activeSponsorsCount }}</strong> ativas no site)</span>
                </div>

                <div class="table-responsive-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr class="font-slab">
                        <th style="width: 50px;">Ordem</th>
                        <th>Logo</th>
                        <th>Nome da Empresa</th>
                        <th>Link / Site</th>
                        <th>Exibição no Carrossel</th>
                        <th style="text-align: right;">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="allSponsors.length === 0">
                        <td colspan="6" class="table-empty font-condensed">
                          Nenhum patrocinador cadastrado na tabela ainda.
                        </td>
                      </tr>
                      <tr v-for="(sponsor, sIdx) in allSponsors" :key="sponsor.id || sIdx">
                        <td class="cell-num font-slab">#{{ sponsor.displayOrder || sIdx + 1 }}</td>
                        <td>
                          <div class="sponsor-thumb-wrap">
                            <img
                              v-if="sponsor.logo"
                              :src="sponsor.logo"
                              :alt="sponsor.name"
                              class="sponsor-table-thumb"
                            />
                            <div v-else class="sponsor-table-placeholder">
                              <i class="fa-solid fa-image"></i>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="font-slab font-bold text-dark">{{ sponsor.name }}</span>
                        </td>
                        <td>
                          <a
                            v-if="sponsor.link"
                            :href="sponsor.link.startsWith('http') ? sponsor.link : 'https://' + sponsor.link"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="sponsor-web-link font-condensed"
                          >
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            {{ sponsor.link }}
                          </a>
                          <span v-else class="text-muted font-condensed">-</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            class="checkin-badge-btn font-condensed"
                            :class="{ 'is-checked': sponsor.isActive }"
                            @click="handleSponsorActive(sponsor.id, !sponsor.isActive)"
                            :title="sponsor.isActive ? 'Clique para ocultar do carrossel' : 'Clique para exibir no carrossel'"
                          >
                            <i :class="sponsor.isActive ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                            {{ sponsor.isActive ? 'Exibindo no Site' : 'Oculto / Pausado' }}
                          </button>
                        </td>
                        <td style="text-align: right;">
                          <div class="action-buttons-cell">
                            <button
                              class="btn-row-action btn-delete"
                              @click="promptDeleteOfficialSponsor(sponsor)"
                              title="Remover marca da Landing Page (requer senha)"
                            >
                              <i class="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Mobile Official Sponsors Cards List (Exibido apenas em mobile <= 768px) -->
                <div class="mobile-cards-list mobile-official-sponsors-list">
                  <div v-if="allSponsors.length === 0" class="table-empty font-condensed">
                    Nenhum patrocinador cadastrado na tabela ainda.
                  </div>
                  <div
                    v-for="(sponsor, sIdx) in allSponsors"
                    :key="sponsor.id || sIdx"
                    class="mobile-data-card"
                  >
                    <div class="mobile-card-top-row">
                      <div class="mobile-sponsor-brand">
                        <div class="sponsor-thumb-wrap">
                          <img
                            v-if="sponsor.logo"
                            :src="sponsor.logo"
                            :alt="sponsor.name"
                            class="sponsor-table-thumb"
                          />
                          <div v-else class="sponsor-table-placeholder">
                            <i class="fa-solid fa-image"></i>
                          </div>
                        </div>
                        <div>
                          <div class="font-slab font-bold text-dark">{{ sponsor.name }}</div>
                          <span class="cell-num font-slab font-bold text-muted">Ordem: #{{ sponsor.displayOrder || sIdx + 1 }}</span>
                        </div>
                      </div>

                      <button
                        class="btn-row-action btn-delete"
                        @click="promptDeleteOfficialSponsor(sponsor)"
                        title="Remover marca da Landing Page (requer senha)"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>

                    <div v-if="sponsor.link" class="mobile-sponsor-link font-condensed">
                      <a
                        :href="sponsor.link.startsWith('http') ? sponsor.link : 'https://' + sponsor.link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="sponsor-web-link"
                      >
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        {{ sponsor.link }}
                      </a>
                    </div>

                    <div class="mobile-card-action-bar">
                      <button
                        type="button"
                        class="checkin-badge-btn font-condensed w-full"
                        :class="{ 'is-checked': sponsor.isActive }"
                        @click="handleSponsorActive(sponsor.id, !sponsor.isActive)"
                      >
                        <i :class="sponsor.isActive ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                        {{ sponsor.isActive ? 'Exibindo no Site (Ativo)' : 'Oculto / Pausado' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- TAB 5: CHECK-IN DIA DA PROVA -->
          <section v-if="activeTab === 'checkin'" class="tab-pane animate-fade-in">
            <div class="checkin-hero vintage-card">
              <div class="checkin-stats">
                <div class="checkin-stat-box">
                  <span class="checkin-num font-slab text-green">{{ checkedInCount }}</span>
                  <span class="checkin-lbl font-condensed">Kits Entregues</span>
                </div>
                <div class="checkin-stat-box">
                  <span class="checkin-num font-slab text-gold">{{ athletes.length - checkedInCount }}</span>
                  <span class="checkin-lbl font-condensed">Ainda Faltam</span>
                </div>
                <div class="checkin-stat-box">
                  <span class="checkin-num font-slab">{{ Math.round((checkedInCount / Math.max(1, athletes.length)) * 100) }}%</span>
                  <span class="checkin-lbl font-condensed">Presença Total</span>
                </div>
              </div>

              <div class="checkin-search-bar">
                <input
                  type="text"
                  v-model="checkinSearch"
                  placeholder="🔍 Digite o nome do atleta para entrega rápida do kit..."
                  class="form-input checkin-input font-condensed"
                  ref="checkinInputRef"
                />
              </div>
            </div>

            <div class="checkin-list">
              <div
                v-for="athlete in checkinFilteredAthletes"
                :key="athlete.id"
                class="checkin-row vintage-card"
                :class="{ 'checked-done': athlete.isCheckedIn }"
              >
                <div class="checkin-athlete-info">
                  <div class="checkin-name-line">
                    <span class="font-slab athlete-name">{{ athlete.name }}</span>
                    <span v-if="athlete.nickname" class="athlete-nick font-condensed">"{{ athlete.nickname }}"</span>
                  </div>
                  <div class="checkin-meta-line font-condensed">
                    <span>{{ athlete.modality === 'kids' ? 'Corrida Kids' : athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}</span>
                    <span>•</span>
                    <span>{{ athlete.drinksBeer ? '🍺 Chopp' : '🚫 Sem Álcool' }}</span>
                    <span v-if="athlete.phone">• Tel: {{ athlete.phone }}</span>
                  </div>
                </div>

                <div class="checkin-action-wrap">
                  <button
                    class="btn-checkin-big font-slab"
                    :class="{ 'btn-checkin-active': athlete.isCheckedIn }"
                    @click="handleCheckIn(athlete.id, !athlete.isCheckedIn)"
                  >
                    <i :class="athlete.isCheckedIn ? 'fa-solid fa-check-double' : 'fa-solid fa-box-open'"></i>
                    {{ athlete.isCheckedIn ? 'KIT ENTREGUE (OK)' : 'ENTREGAR KIT' }}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- SUB-MODAL 1: CADASTRO MANUAL DE ATLETA -->
    <div v-if="showAddModal" class="modal-backdrop-inner" @click.self="showAddModal = false">
      <div class="sub-modal-card vintage-card animate-slide-up">
        <h3 class="font-slab sub-modal-title">
          <i class="fa-solid fa-user-plus text-amber"></i> CADASTRAR ATLETA MANUALMENTE
        </h3>
        <p class="font-condensed text-muted sub-modal-desc">
          Insira um atleta convidado ou inscrição manual direta da comissão organizadora.
        </p>

        <form @submit.prevent="handleAddAthlete" class="sub-modal-form font-condensed">
          <div class="form-group">
            <label class="form-label font-slab">NOME COMPLETO *</label>
            <input type="text" v-model="newAthlete.name" required placeholder="Nome e Sobrenome" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label font-slab">APELIDO NA CORRIDA</label>
            <input type="text" v-model="newAthlete.nickname" placeholder="Ex: Mestre Cervejeiro" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label font-slab">WHATSAPP / TELEFONE *</label>
            <input type="tel" v-model="newAthlete.phone" required placeholder="(35) 99999-9999" class="form-input" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label font-slab">MODALIDADE</label>
              <select v-model="newAthlete.modality" class="form-input">
                <option value="corrida">Corrida (6,37 km)</option>
                <option value="caminhada">Caminhada</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label font-slab">BEBE CERVEJA?</label>
              <select v-model="newAthlete.drinksBeer" class="form-input">
                <option :value="true">Sim (Chopp Gelado)</option>
                <option :value="false">Não (Sem Álcool)</option>
              </select>
            </div>
          </div>

          <div v-if="addError" class="modal-error font-condensed">
            <i class="fa-solid fa-circle-exclamation"></i> {{ addError }}
          </div>

          <div class="sub-modal-actions">
            <button type="button" class="btn-cancel font-condensed" @click="showAddModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-vintage font-slab" :disabled="isSubmitting">
              <i class="fa-solid fa-check"></i> Salvar Inscrição
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- SUB-MODAL 2: CONFIRMAÇÃO DE EXCLUSÃO COM SENHA DE ADMIN -->
    <div v-if="showDeleteModal" class="modal-backdrop-inner" @click.self="showDeleteModal = false">
      <div class="sub-modal-card vintage-card modal-danger animate-slide-up">
        <div class="danger-header">
          <div class="danger-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="font-slab danger-title">CONFIRMAÇÃO DE SEGURANÇA</h3>
        </div>

        <div class="danger-body font-condensed">
          <p class="danger-warning">
            Tem certeza de que deseja excluir permanentemente este registro?
          </p>
          <div class="target-item-box">
            <strong>{{ targetDeleteName }}</strong>
            <span v-if="targetDeleteType"> ({{ targetDeleteType }})</span>
          </div>
          <p class="danger-note">
            ⚠️ <strong>Esta ação é irreversível</strong> e a vaga será reaberta no sistema. Para autorizar a exclusão, digite a <strong>senha mestre de administrador</strong>:
          </p>

          <div class="form-group mt-3">
            <label class="form-label font-slab">SENHA DO ADMIN:</label>
            <input
              type="password"
              v-model="deleteConfirmPassword"
              placeholder="Digite a senha de administrador..."
              class="form-input font-condensed"
              ref="deletePasswordInputRef"
              @keyup.enter="executeDeletion"
            />
          </div>

          <div v-if="deleteError" class="modal-error font-condensed">
            <i class="fa-solid fa-circle-exclamation"></i> {{ deleteError }}
          </div>
        </div>

        <div class="sub-modal-actions">
          <button type="button" class="btn-cancel font-condensed" @click="showDeleteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn-danger-confirm font-slab" @click="executeDeletion">
            <i class="fa-solid fa-trash-can"></i> CONFIRMAR EXCLUSÃO
          </button>
        </div>
      </div>
    </div>

    <!-- SUB-MODAL 3: CONFIRMAÇÃO DE PROMOÇÃO DE ATLETA DA WAITLIST -->
    <div v-if="showPromoteModal" class="modal-backdrop-inner" @click.self="showPromoteModal = false">
      <div class="sub-modal-card vintage-card animate-slide-up">
        <h3 class="font-slab sub-modal-title">
          <i class="fa-solid fa-star text-gold"></i> PROMOVER DA LISTA DE ESPERA
        </h3>
        <p class="font-condensed sub-modal-desc">
          O atleta <strong>{{ targetPromoteAthlete?.name }}</strong> será transferido imediatamente para a lista oficial de <strong>Atletas Confirmados</strong>.
        </p>

        <div class="promote-info-box font-condensed">
          <div><strong>WhatsApp:</strong> {{ targetPromoteAthlete?.phone }}</div>
          <div><strong>Modalidade:</strong> {{ targetPromoteAthlete?.modality === 'caminhada' ? 'Caminhada' : 'Corrida' }}</div>
          <div><strong>Chopp:</strong> {{ targetPromoteAthlete?.drinksBeer ? 'Sim 🍺' : 'Sem Álcool 🚫' }}</div>
        </div>

        <div class="sub-modal-actions">
          <button type="button" class="btn-cancel font-condensed" @click="showPromoteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn-vintage font-slab" @click="executePromote">
            <i class="fa-solid fa-check"></i> Confirmar Promoção
          </button>
        </div>
      </div>
    </div>

    <!-- SUB-MODAL 4: CADASTRO MANUAL DE PATROCINADOR NO SITE -->
    <div v-if="showAddSponsorModal" class="modal-backdrop-inner" @click.self="showAddSponsorModal = false">
      <div class="sub-modal-card vintage-card animate-slide-up">
        <h3 class="font-slab sub-modal-title">
          <i class="fa-solid fa-handshake text-amber"></i> ADICIONAR MARCA NO SITE
        </h3>
        <p class="font-condensed text-muted sub-modal-desc">
          Cadastre o patrocinador para exibição no carrossel oficial da Landing Page.
        </p>

        <form @submit.prevent="handleAddOfficialSponsor" class="sub-modal-form font-condensed">
          <div class="form-group">
            <label class="form-label font-slab">NOME DA EMPRESA / MARCA *</label>
            <input type="text" v-model="newOfficialSponsor.name" required placeholder="Ex: Padaria Santa Rita" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label font-slab">URL DA LOGO (IMAGEM)</label>
            <input type="text" v-model="newOfficialSponsor.logo" placeholder="https://... ou caminho do logo" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label font-slab">LINK DO SITE OU INSTAGRAM</label>
            <input type="text" v-model="newOfficialSponsor.link" placeholder="https://instagram.com/marca" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label font-slab">ORDEM DE EXIBIÇÃO</label>
            <input type="number" v-model.number="newOfficialSponsor.displayOrder" placeholder="1" class="form-input" />
          </div>

          <div v-if="addSponsorError" class="modal-error font-condensed">
            <i class="fa-solid fa-circle-exclamation"></i> {{ addSponsorError }}
          </div>

          <div class="sub-modal-actions">
            <button type="button" class="btn-cancel font-condensed" @click="showAddSponsorModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-vintage font-slab" :disabled="isSubmittingSponsor">
              <i class="fa-solid fa-check"></i> Salvar no Site
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import StaffTeamPanel from './StaffTeamPanel.vue'
import { formatShirtSelection } from '../services/shirts.js'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { isActiveWaitlistEntry } from '../services/waitlist.js'
import { useStaff } from '../composables/useStaff.js'
import { useSponsors } from '../composables/useSponsors.js'

defineEmits(['exit-staff'])

const {
  allSponsors,
  fetchStaffSponsors,
  publishProposalToSponsors,
  toggleSponsorActive,
  deleteSponsor: removeSponsorFromSite,
  addSponsor: addOfficialSponsor
} = useSponsors()

const {
  isAuthenticated,
  athletes,
  athleteSummary,
  athletesLoading,
  athletesError,
  staffError,
  fetchStaffAthletes,
  waitlist,
  proposals,
  isLoading,
  maxAthletes,
  login,
  logout,
  restoreSession,
  deleteAthlete,
  addAthleteManual,
  toggleCheckIn,
  updateAthletePaymentStatus,
  fetchWaitlist,
  updateWaitlistStatus,
  promoteAthleteToConfirmed,
  deleteWaitlist,
  fetchProposals,
  updateProposalStatus,
  deleteProposal,
  getAthleteWhatsAppLink,
  getWaitlistWhatsAppLink,
  getSponsorWhatsAppLink,
  exportAthletesCSV,
  exportWaitlistCSV,
  exportProposalsCSV
} = useStaff()

const waitlistView = ref('active')
const activeWaitlist = computed(() => waitlist.value.filter(isActiveWaitlistEntry))
const visibleWaitlist = computed(() => waitlistView.value === 'active'
  ? activeWaitlist.value : waitlist.value.filter(item => !isActiveWaitlistEntry(item)))

// Estado de Status de Pagamento e Toast
const athleteFilterPaymentStatus = ref('all')
const paymentStatusToast = ref('')

const athletesCompletedCount = computed(() => athletes.value.filter(a => a.paymentStatus === 'completed').length)
const formatMoney = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
const athletesPendingPaymentCount = computed(() => athletes.value.filter(a => a.paymentStatus === 'pending_payment' || (a.acceptedTermsAt && a.paymentStatus !== 'completed')).length)
const athletesPreRegistrationCount = computed(() => athletes.value.filter(a => !a.acceptedTermsAt && a.paymentStatus !== 'completed' && a.paymentStatus !== 'pending_payment').length)

async function handleConfirmPayment(athlete) {
  try {
    await updateAthletePaymentStatus(athlete.id, 'completed')
    paymentStatusToast.value = `✓ Inscrição de "${athlete.name}" atualizada para CONCLUÍDO!`
    setTimeout(() => { paymentStatusToast.value = '' }, 4000)
  } catch (err) {
    alert('Erro ao atualizar status de pagamento: ' + err.message)
  }
}

async function handleTogglePaymentStatus(athlete) {
  const current = athlete.paymentStatus
  const newStatus = current === 'completed' ? 'pending_payment' : 'completed'
  const confirmMsg = newStatus === 'pending_payment'
    ? `Deseja reverter a inscrição de "${athlete.name}" para AGUARDANDO PAGAMENTO?`
    : `Deseja aprovar o pagamento de "${athlete.name}" e marcar como CONCLUÍDO?`
  if (!confirm(confirmMsg)) return

  try {
    await updateAthletePaymentStatus(athlete.id, newStatus)
    paymentStatusToast.value = `✓ Status de "${athlete.name}" alterado para ${newStatus === 'completed' ? 'CONCLUÍDO' : 'AGUARDANDO PAGAMENTO'}!`
    setTimeout(() => { paymentStatusToast.value = '' }, 4000)
  } catch (err) {
    alert('Erro ao atualizar status: ' + err.message)
  }
}

// Estado da aba de Patrocínios & Sponsors
const sponsorSubTab = ref('proposals')
const publishToastMessage = ref('')
const activeSponsorsCount = computed(() => allSponsors.value.filter(s => s.isActive).length)

async function handleProposalStatusChange(prop, newStatus) {
  try {
    await updateProposalStatus(prop.id, newStatus)
    if (newStatus === 'finished') {
      await fetchStaffSponsors()
      publishToastMessage.value = `Proposta da marca "${prop.companyName}" concluída e publicada!`
      setTimeout(() => { publishToastMessage.value = '' }, 6000)
    }
  } catch (err) {
    window.alert(err.message)
    await fetchProposals().catch(() => {})
  }
}

async function handleManualPublishToSite(prop) {
  try {
    await publishProposalToSponsors(prop)
    publishToastMessage.value = `✓ Marca "${prop.companyName}" sincronizada com sucesso na tabela de Patrocinadores da Landing Page!`
    setTimeout(() => { publishToastMessage.value = '' }, 5000)
  } catch (e) {
    alert('Erro ao publicar patrocinador: ' + (e.message || e))
  }
}

const showAddSponsorModal = ref(false)
const isSubmittingSponsor = ref(false)
const addSponsorError = ref('')
const newOfficialSponsor = ref({
  name: '',
  logo: '',
  link: '',
  displayOrder: 1
})

function openAddOfficialSponsorModal() {
  newOfficialSponsor.value = {
    name: '',
    logo: '',
    link: '',
    displayOrder: allSponsors.value.length + 1
  }
  addSponsorError.value = ''
  showAddSponsorModal.value = true
}

async function handleAddOfficialSponsor() {
  addSponsorError.value = ''
  isSubmittingSponsor.value = true
  try {
    await addOfficialSponsor(newOfficialSponsor.value)
    showAddSponsorModal.value = false
  } catch (e) {
    addSponsorError.value = e.message || 'Erro ao adicionar patrocinador'
  } finally {
    isSubmittingSponsor.value = false
  }
}

function promptDeleteOfficialSponsor(sponsor) {
  targetDeleteType.value = 'Patrocinador Oficial do Site'
  targetDeleteId.value = sponsor.id
  targetDeleteName.value = sponsor.name
  deleteConfirmPassword.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
  nextTick(() => deletePasswordInputRef.value?.focus())
}

// ----------------------------------------------------------------------------
// LOGIN STATE
// ----------------------------------------------------------------------------
const pinInput = ref('')
const showPassword = ref(false)
const loginErrorMessage = ref('')
const pinInputRef = ref(null)

async function handleLoginSubmit() {
  if (isLoading.value || athletesLoading.value) return
  loginErrorMessage.value = ''
  const success = await login(pinInput.value)
  if (success) {
    pinInput.value = ''
    refreshAll()
  } else {
    loginErrorMessage.value = staffError.value || 'Senha incorreta! Verifique com a comissão organizadora.'
  }
}

// ----------------------------------------------------------------------------
// TABS & FILTROS
// ----------------------------------------------------------------------------
const activeTab = ref('overview')

const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)
const runnersCount = computed(() => athletes.value.filter(a => a.modality === 'corrida').length)
const walkersCount = computed(() => athletes.value.filter(a => a.modality === 'caminhada').length)
const checkedInCount = computed(() => athletes.value.filter(a => a.isCheckedIn).length)

const proposalsPendingCount = computed(() => proposals.value.filter(p => p.status === 'pending').length)
const proposalsApprovedCount = computed(() => proposals.value.filter(p => p.status === 'approved').length)
const proposalsFinishedCount = computed(() => proposals.value.filter(p => p.status === 'finished').length)
const proposalsRejectedCount = computed(() => proposals.value.filter(p => p.status === 'rejected').length)

// Filtros Atletas
const athleteSearch = ref('')
const athleteFilterModality = ref('all')
const athleteFilterBeer = ref('all')

const filteredAthletes = computed(() => {
  let list = athletes.value

  if (athleteSearch.value.trim()) {
    const q = athleteSearch.value.toLowerCase().trim()
    list = list.filter(a =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.nickname && a.nickname.toLowerCase().includes(q)) ||
      (a.guardianName && a.guardianName.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q))
    )
  }

  if (athleteFilterModality.value === 'corrida') {
    list = list.filter(a => a.modality === 'corrida')
  } else if (athleteFilterModality.value === 'kids') {
    list = list.filter(a => a.modality === 'kids')
  } else if (athleteFilterModality.value === 'caminhada') {
    list = list.filter(a => a.modality === 'caminhada')
  }

  if (athleteFilterBeer.value === 'drinks') {
    list = list.filter(a => a.drinksBeer)
  } else if (athleteFilterBeer.value === 'no-drinks') {
    list = list.filter(a => !a.drinksBeer)
  }

  if (athleteFilterPaymentStatus.value === 'completed') {
    list = list.filter(a => a.paymentStatus === 'completed')
  } else if (athleteFilterPaymentStatus.value === 'pending_payment') {
    list = list.filter(a => a.paymentStatus === 'pending_payment' || (a.acceptedTermsAt && a.paymentStatus !== 'completed'))
  } else if (athleteFilterPaymentStatus.value === 'pre_registration') {
    list = list.filter(a => !a.acceptedTermsAt && a.paymentStatus !== 'completed' && a.paymentStatus !== 'pending_payment')
  }

  return list
})

// Filtros Patrocínios
const sponsorFilterStatus = ref('all')

const filteredProposals = computed(() => {
  if (sponsorFilterStatus.value === 'all') return proposals.value
  return proposals.value.filter(p => p.status === sponsorFilterStatus.value)
})

function formatSponsorshipType(type) {
  const map = {
    money: '💵 Apoio Financeiro (R$)',
    gifts: '🎁 Brindes / Produtos para o Kit',
    structure: '🎪 Estrutura / Serviços',
    mixed: '🤝 Misto (R$ + Produtos/Brindes)'
  }
  return map[type] || type || 'Apoio'
}

// Check-in Dia da Prova
const checkinSearch = ref('')
const checkinInputRef = ref(null)

const checkinFilteredAthletes = computed(() => {
  if (!checkinSearch.value.trim()) return athletes.value
  const q = checkinSearch.value.toLowerCase().trim()
  return athletes.value.filter(a =>
    (a.name && a.name.toLowerCase().includes(q)) ||
    (a.nickname && a.nickname.toLowerCase().includes(q)) ||
      (a.guardianName && a.guardianName.toLowerCase().includes(q)) ||
    (a.phone && a.phone.includes(q))
  )
})

// Cadastro Manual
const showAddModal = ref(false)
const isSubmitting = ref(false)
const addError = ref('')
const newAthlete = ref({
  name: '',
  nickname: '',
  phone: '',
  modality: 'corrida',
  drinksBeer: true
})

function openAddAthleteModal() {
  newAthlete.value = {
    name: '',
    nickname: '',
    phone: '',
    modality: 'corrida',
    drinksBeer: true
  }
  addError.value = ''
  showAddModal.value = true
}

async function handleAddAthlete() {
  addError.value = ''
  isSubmitting.value = true
  try {
    await addAthleteManual(newAthlete.value)
    showAddModal.value = false
  } catch (err) {
    addError.value = err.message || 'Erro ao cadastrar atleta'
  } finally {
    isSubmitting.value = false
  }
}

// Confirmação com Senha de Admin
const showDeleteModal = ref(false)
const deleteConfirmPassword = ref('')
const deleteError = ref('')
const deletePasswordInputRef = ref(null)

const targetDeleteType = ref('')
const targetDeleteId = ref(null)
const targetDeleteName = ref('')

function promptDeleteAthlete(athlete) {
  targetDeleteType.value = 'Atleta Confirmado'
  targetDeleteId.value = athlete.id
  targetDeleteName.value = athlete.name + (athlete.nickname ? ` ("${athlete.nickname}")` : '')
  deleteConfirmPassword.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
  nextTick(() => deletePasswordInputRef.value?.focus())
}

function promptDeleteWaitlist(item) {
  targetDeleteType.value = 'Lista de Espera'
  targetDeleteId.value = item.id
  targetDeleteName.value = item.name + (item.nickname ? ` ("${item.nickname}")` : '')
  deleteConfirmPassword.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
  nextTick(() => deletePasswordInputRef.value?.focus())
}

function promptDeleteProposal(prop) {
  targetDeleteType.value = 'Proposta de Patrocínio'
  targetDeleteId.value = prop.id
  targetDeleteName.value = prop.companyName + ` (Contato: ${prop.contactName})`
  deleteConfirmPassword.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
  nextTick(() => deletePasswordInputRef.value?.focus())
}

async function executeDeletion() {
  deleteError.value = ''
  if (!deleteConfirmPassword.value) {
    deleteError.value = 'Por favor, digite a senha de administrador!'
    return
  }

  try {
    if (targetDeleteType.value === 'Atleta Confirmado') {
      await deleteAthlete(targetDeleteId.value, deleteConfirmPassword.value)
    } else if (targetDeleteType.value === 'Lista de Espera') {
      await deleteWaitlist(targetDeleteId.value, deleteConfirmPassword.value)
    } else if (targetDeleteType.value === 'Proposta de Patrocínio') {
      await deleteProposal(targetDeleteId.value, deleteConfirmPassword.value)
    } else if (targetDeleteType.value === 'Patrocinador Oficial do Site') {
      await removeSponsorFromSite(targetDeleteId.value, deleteConfirmPassword.value)
    }
    deleteConfirmPassword.value = ''
    showDeleteModal.value = false
  } catch (err) {
    deleteError.value = err.message || 'Senha incorreta ou erro ao excluir!'
  }
}

// Promoção de Waitlist
const showPromoteModal = ref(false)
const targetPromoteAthlete = ref(null)

async function handleWaitlistStatusChange(item, event) {
  const select = event.target
  const status = select.value
  select.disabled = true
  try {
    await updateWaitlistStatus(item.id, status)
  } catch (error) {
    window.alert(error.message || 'Não foi possível salvar o status.')
  } finally {
    select.value = item.status
    select.disabled = false
  }
}

function confirmPromoteAthlete(item) {
  targetPromoteAthlete.value = item
  showPromoteModal.value = true
}

async function executePromote() {
  if (!targetPromoteAthlete.value) return
  try {
    await promoteAthleteToConfirmed(targetPromoteAthlete.value)
    showPromoteModal.value = false
  } catch (err) {
    alert(err.message || 'Erro ao promover atleta')
  }
}

function formatDate(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return isoString
  }
}

async function handleCheckIn(id, value) {
  try { await toggleCheckIn(id, value) } catch (err) { window.alert(err.message) }
}
async function handleSponsorActive(id, value) {
  try { await toggleSponsorActive(id, value) } catch (err) { window.alert(err.message) }
}

const teamPanel = ref(null)
async function refreshAll() {
  staffError.value = null
  const results = await Promise.allSettled([
    fetchStaffAthletes(),
    fetchWaitlist(),
    fetchProposals(),
    fetchStaffSponsors(),
    teamPanel.value?.refresh()
  ])
  const failure = results.find(result => result.status === 'rejected')
  if (failure) staffError.value = failure.reason.message
}

async function handleLogout() {
  try { await logout(); pinInput.value = ''; deleteConfirmPassword.value = '' }
  catch (err) { window.alert(err.message) }
}

let waitlistRefreshTimer
onMounted(async () => {
  isLoading.value = true
  await restoreSession()
  isLoading.value = false
  waitlistRefreshTimer = setInterval(() => {
    if (isAuthenticated.value && document.visibilityState === 'visible') {
      fetchWaitlist().catch(error => { staffError.value = error.message })
      if (!athletesLoading.value) fetchStaffAthletes()
    }
  }, 30000)
  if (isAuthenticated.value) {
    refreshAll()
  } else {
    nextTick(() => pinInputRef.value?.focus())
  }
})
onUnmounted(() => clearInterval(waitlistRefreshTimer))
</script>

<style scoped src="../styles/staff-dashboard.css"></style>
