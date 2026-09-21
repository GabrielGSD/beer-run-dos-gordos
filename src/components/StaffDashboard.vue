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
              <button type="submit" class="btn-vintage btn-submit font-slab">
                <i class="fa-solid fa-key"></i> ENTRAR NO PAINEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- TELA 2: DASHBOARD COMPLETO EM TELA CHEIA (AUTENTICADO) -->
    <div v-else class="staff-app-container">
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
              <div class="db-status-pill font-condensed" :class="{ 'status-online': isSupabaseConfigured, 'status-local': !isSupabaseConfigured }">
                <span class="status-dot"></span>
                <span class="status-text-full">{{ isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Offline / Local' }}</span>
                <span class="status-text-short">{{ isSupabaseConfigured ? 'Online' : 'Offline' }}</span>
              </div>
            </div>
          </div>

          <div class="header-right">
            <button class="btn-tool font-condensed" @click="refreshAll" :disabled="isLoading" title="Recarregar Dados">
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
              <span v-if="waitlist.length > 0" class="tab-badge badge-warning">{{ waitlist.length }}</span>
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
          <!-- TAB 1: VISÃO GERAL -->
          <section v-if="activeTab === 'overview'" class="tab-pane animate-fade-in">
            <div class="kpi-grid">
              <!-- Card 1: Inscrições -->
              <div class="kpi-card vintage-card">
                <div class="kpi-header">
                  <span class="kpi-tag font-condensed">OCUPAÇÃO DO EVENTO</span>
                  <i class="fa-solid fa-users kpi-icon"></i>
                </div>
                <div class="kpi-value font-slab">{{ athletes.length }} <span>/ {{ maxAthletes }}</span></div>
                <div class="kpi-progress-bar">
                  <div class="progress-fill" :style="{ width: `${Math.min(100, (athletes.length / maxAthletes) * 100)}%` }"></div>
                </div>
                <div class="kpi-footer font-condensed">
                  <span v-if="athletes.length >= maxAthletes" class="text-danger font-bold">⚠️ Vagas Esgotadas!</span>
                  <span v-else class="text-success font-bold">{{ maxAthletes - athletes.length }} vagas restantes</span>
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
                <div class="kpi-value font-slab text-gold">{{ waitlist.length }}</div>
                <p class="kpi-desc font-condensed">Atletas na fila aguardando vagas por desistência.</p>
                <div class="kpi-footer">
                  <button
                    v-if="waitlist.length > 0"
                    class="btn-vintage btn-sm font-condensed"
                    @click="activeTab = 'waitlist'"
                  >
                    Ver Fila de Espera →
                  </button>
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
                  Todos
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
              </div>

              <!-- Mobile Filter Dropdowns (100% largura, Zero Scroll Horizontal) -->
              <div class="mobile-athlete-filters-grid font-condensed">
                <div class="mobile-select-group">
                  <label class="mobile-select-label"><i class="fa-solid fa-person-running"></i> Modalidade:</label>
                  <select v-model="athleteFilterModality" class="mobile-filter-dropdown">
                    <option value="all">Todas modalidades</option>
                    <option value="corrida">🏃 Corrida (6,37 km)</option>
                    <option value="caminhada">🚶 Caminhada</option>
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
                <span>Capacidade Máxima: <strong>{{ maxAthletes }} vagas</strong></span>
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
                      <th>Check-in</th>
                      <th style="text-align: right;">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredAthletes.length === 0">
                      <td colspan="7" class="table-empty font-condensed">
                        Nenhum atleta encontrado com os filtros selecionados.
                      </td>
                    </tr>
                    <tr v-for="(athlete, index) in filteredAthletes" :key="athlete.id">
                      <td class="cell-num font-slab">{{ index + 1 }}</td>
                      <td>
                        <div class="athlete-name-cell">
                          <div class="font-slab athlete-name">{{ athlete.name }}</div>
                          <div v-if="athlete.nickname" class="athlete-nick font-condensed">"{{ athlete.nickname }}"</div>
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
                          {{ athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
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
                      <td>
                        <button
                          class="checkin-badge-btn font-condensed"
                          :class="{ 'is-checked': athlete.isCheckedIn }"
                          @click="toggleCheckIn(athlete.id, !athlete.isCheckedIn)"
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
                      {{ athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}
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

                  <div class="mobile-card-action-bar">
                    <button
                      class="mobile-checkin-btn font-condensed"
                      :class="{ 'is-checked': athlete.isCheckedIn }"
                      @click="toggleCheckIn(athlete.id, !athlete.isCheckedIn)"
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
                  Ordem estrita de cadastro. Quando abrir vaga, promova o primeiro da fila ou contate via WhatsApp!
                </span>
              </div>

              <div class="toolbar-actions">
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
                    <tr v-if="waitlist.length === 0">
                      <td colspan="8" class="table-empty font-condensed">
                        A lista de espera está vazia no momento.
                      </td>
                    </tr>
                    <tr v-for="(item, idx) in waitlist" :key="item.id">
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
                          v-model="item.status"
                          @change="updateWaitlistStatus(item.id, item.status)"
                          class="status-select font-condensed"
                          :class="'status-' + item.status"
                        >
                          <option value="waiting">⏳ Aguardando</option>
                          <option value="called">📞 Contatado</option>
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
                <div v-if="waitlist.length === 0" class="table-empty font-condensed">
                  A lista de espera está vazia no momento.
                </div>
                <div
                  v-for="(item, idx) in waitlist"
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
                      v-model="item.status"
                      @change="updateWaitlistStatus(item.id, item.status)"
                      class="status-select font-condensed"
                      :class="'status-' + item.status"
                    >
                      <option value="waiting">⏳ Aguardando</option>
                      <option value="called">📞 Contatado</option>
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
                            @click="toggleSponsorActive(sponsor.id, !sponsor.isActive)"
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
                        @click="toggleSponsorActive(sponsor.id, !sponsor.isActive)"
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
                    <span>{{ athlete.modality === 'caminhada' ? '🚶 Caminhada' : '🏃 Corrida' }}</span>
                    <span>•</span>
                    <span>{{ athlete.drinksBeer ? '🍺 Chopp' : '🚫 Sem Álcool' }}</span>
                    <span v-if="athlete.phone">• Tel: {{ athlete.phone }}</span>
                  </div>
                </div>

                <div class="checkin-action-wrap">
                  <button
                    class="btn-checkin-big font-slab"
                    :class="{ 'btn-checkin-active': athlete.isCheckedIn }"
                    @click="toggleCheckIn(athlete.id, !athlete.isCheckedIn)"
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStaff } from '../composables/useStaff.js'
import { useAthletes } from '../composables/useAthletes.js'
import { useSponsors } from '../composables/useSponsors.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

defineEmits(['exit-staff'])

const {
  athletes,
  fetchAthletes
} = useAthletes()

const {
  allSponsors,
  fetchSponsors,
  publishProposalToSponsors,
  toggleSponsorActive,
  deleteSponsor: removeSponsorFromSite,
  addSponsor: addOfficialSponsor
} = useSponsors()

const {
  isAuthenticated,
  waitlist,
  proposals,
  isLoading,
  maxAthletes,
  login,
  logout,
  deleteAthlete,
  addAthleteManual,
  toggleCheckIn,
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

// Estado da aba de Patrocínios & Sponsors
const sponsorSubTab = ref('proposals')
const publishToastMessage = ref('')
const activeSponsorsCount = computed(() => allSponsors.value.filter(s => s.isActive).length)

async function handleProposalStatusChange(prop, newStatus) {
  await updateProposalStatus(prop.id, newStatus)
  if (newStatus === 'finished') {
    try {
      await publishProposalToSponsors(prop)
      publishToastMessage.value = `🎉 Proposta da marca "${prop.companyName}" foi concluída e adicionada automaticamente aos Patrocinadores da Landing Page!`
      setTimeout(() => { publishToastMessage.value = '' }, 6000)
    } catch (e) {
      console.warn('Aviso ao publicar patrocinador:', e)
    }
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

function handleLoginSubmit() {
  loginErrorMessage.value = ''
  const success = login(pinInput.value)
  if (success) {
    pinInput.value = ''
    refreshAll()
  } else {
    loginErrorMessage.value = 'Senha incorreta! Verifique com a comissão organizadora.'
  }
}

// ----------------------------------------------------------------------------
// TABS & FILTROS
// ----------------------------------------------------------------------------
const activeTab = ref('overview')

const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)
const runnersCount = computed(() => athletes.value.filter(a => a.modality !== 'caminhada').length)
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
      (a.phone && a.phone.includes(q))
    )
  }

  if (athleteFilterModality.value === 'corrida') {
    list = list.filter(a => a.modality !== 'caminhada')
  } else if (athleteFilterModality.value === 'caminhada') {
    list = list.filter(a => a.modality === 'caminhada')
  }

  if (athleteFilterBeer.value === 'drinks') {
    list = list.filter(a => a.drinksBeer)
  } else if (athleteFilterBeer.value === 'no-drinks') {
    list = list.filter(a => !a.drinksBeer)
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
      await removeSponsorFromSite(targetDeleteId.value)
    }
    showDeleteModal.value = false
  } catch (err) {
    deleteError.value = err.message || 'Senha incorreta ou erro ao excluir!'
  }
}

// Promoção de Waitlist
const showPromoteModal = ref(false)
const targetPromoteAthlete = ref(null)

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

async function refreshAll() {
  await Promise.all([
    fetchAthletes(),
    fetchWaitlist(),
    fetchProposals(),
    fetchSponsors()
  ])
}

function handleLogout() {
  logout()
}

onMounted(() => {
  if (isAuthenticated.value) {
    refreshAll()
  } else {
    nextTick(() => pinInputRef.value?.focus())
  }
})
</script>

<style scoped>
/* Page Root */
.staff-page-view {
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-parchment, #e4d5b7);
  background-image: linear-gradient(rgb(247 241 228 / 45%), rgb(247 241 228)), url(/bg02.jpg);
  background-size: contain;
  background-repeat: repeat-y;
  color: var(--text-dark, #1c1b18);
  display: flex;
  flex-direction: column;
}

/* ==========================================================================
   TELA DE LOGIN EM TELA CHEIA
   ========================================================================== */
.staff-login-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.login-top-bar {
  display: flex;
  justify-content: flex-start;
  padding: 8px 12px;
}

.btn-back-to-site {
  background: rgba(44, 39, 31, 0.1);
  border: 2px solid var(--accent-border, #2c271f);
  color: var(--text-dark, #1c1b18);
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 800;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-back-to-site:hover {
  background: var(--accent-border, #2c271f);
  color: #fff;
}

.login-center-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.staff-login-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: var(--bg-parchment-light, #fbf7ee);
  border: 4px solid var(--accent-border, #2c271f);
  box-shadow: 10px 10px 0px rgba(44, 39, 31, 0.8);
  padding: 40px 28px 30px;
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

.login-header {
  margin-bottom: 24px;
}

.vintage-icon {
  font-size: 2.8rem;
  color: var(--accent-gold, #d9822b);
  margin-bottom: 8px;
}

.login-title {
  font-size: 1.7rem;
  color: var(--text-dark, #1c1b18);
  margin-bottom: 6px;
}

.login-sub {
  font-size: 0.95rem;
  color: var(--text-muted, #4e483d);
  line-height: 1.4;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
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

/* ==========================================================================
   DASHBOARD EM TELA CHEIA (STAFF APP)
   ========================================================================== */
.staff-app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* Sticky Header + Tabs Combined Container (Garante alinhamento perfeito) */
.staff-sticky-top {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* Header */
.staff-header {
  background: var(--accent-dark, #191714);
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid var(--accent-gold, #d9822b);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-back-site {
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid var(--accent-gold, #d9822b);
  color: #fff;
  padding: 7px 14px;
  font-size: 0.88rem;
  font-weight: 800;
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-back-site:hover {
  background: var(--accent-gold, #d9822b);
  color: #191714;
}

.btn-text-mobile {
  display: none;
}

.brand-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.brand-title {
  font-size: 1.35rem;
  letter-spacing: 0.5px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  white-space: nowrap;
}

.brand-title-short {
  display: none;
}

.db-status-pill {
  font-size: 0.78rem;
  padding: 3px 9px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-text-short {
  display: none;
}

.status-online {
  background: rgba(46, 125, 50, 0.25);
  color: #81c784;
  border: 1px solid #2e7d32;
}

.status-local {
  background: rgba(230, 145, 40, 0.2);
  color: #ffb74d;
  border: 1px solid #e69128;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: currentColor;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-tool {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-tool:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-logout:hover {
  background: #b71c1c;
  border-color: #b71c1c;
}

/* Sticky Navigation Tabs */
.staff-nav-tabs {
  background: var(--bg-parchment-dark, #d5c3a1);
  border-bottom: 2px solid var(--accent-border, #2c271f);
  width: 100%;
}

.tabs-scroll-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  overflow-x: auto;
  padding: 0 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.mobile-cards-list {
  display: none;
}

.tab-label-mobile {
  display: none;
}

.tab-label-desktop {
  display: inline;
}

.mobile-filter-select-wrap {
  display: none;
}

.mobile-athlete-filters-grid {
  display: none;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 14px 18px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-muted, #4e483d);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-dark, #1c1b18);
  background: rgba(255, 255, 255, 0.25);
}

.tab-btn.active {
  color: var(--text-dark, #1c1b18);
  border-bottom-color: var(--accent-gold, #d9822b);
  background: var(--bg-parchment, #e4d5b7);
}

.tab-badge {
  background: var(--accent-dark, #191714);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 7px;
  border-radius: 10px;
  font-family: var(--font-condensed);
}

.badge-warning {
  background: #d9822b;
  color: #fff;
}

.badge-gold {
  background: #bf8008;
  color: #fff;
}

.badge-green {
  background: #2e7d32;
  color: #fff;
}

/* Content Body */
.staff-content-body {
  flex: 1;
  padding: 20px 16px 40px;
}

.staff-page-content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.span-2 {
  grid-column: span 2;
}

@media (max-width: 900px) {
  .span-2 {
    grid-column: span 1;
  }
}

.kpi-card {
  background: var(--bg-parchment-light, #fbf7ee);
  border: 2px solid var(--accent-border, #2c271f);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 4px 4px 0px rgba(44, 39, 31, 0.2);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kpi-tag {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-muted, #4e483d);
}

.kpi-icon {
  font-size: 1.4rem;
  color: var(--text-dark, #1c1b18);
}

.kpi-value {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--text-dark, #1c1b18);
  line-height: 1.1;
}

.kpi-value span {
  font-size: 1.2rem;
  color: var(--text-muted, #4e483d);
}

.kpi-progress-bar {
  height: 10px;
  background: #dfd5be;
  border: 1px solid var(--accent-border, #2c271f);
  border-radius: 5px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #d9822b, #2e7d32);
  transition: width 0.3s;
}

.kpi-split-stat {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 12px 0;
}

.stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 2rem;
  font-weight: 900;
}

.stat-lbl {
  font-size: 0.85rem;
  color: var(--text-muted, #4e483d);
}

.stat-divider {
  width: 2px;
  height: 40px;
  background: #d5c3a1;
}

.kpi-desc {
  font-size: 0.9rem;
  color: var(--text-muted, #4e483d);
  margin: 6px 0 12px;
}

.kpi-footer {
  font-size: 0.85rem;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Sponsor Pipeline in KPI */
.sponsor-pipeline-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0;
  gap: 8px;
  flex-wrap: wrap;
}

.pipe-step {
  background: #fff;
  border: 1px solid var(--accent-border, #2c271f);
  padding: 10px 14px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 110px;
}

.pipe-num {
  font-family: var(--font-slab);
  font-size: 1.5rem;
  font-weight: 900;
}

.pipe-lbl {
  font-size: 0.75rem;
  color: var(--text-muted, #4e483d);
  text-align: center;
}

.pipe-arrow {
  color: var(--text-muted, #4e483d);
  font-size: 0.9rem;
}

/* Toolbar */
.pane-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--bg-parchment-light, #fbf7ee);
  border: 2px solid var(--accent-border, #2c271f);
  padding: 12px 16px;
  border-radius: 4px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted, #4e483d);
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  font-size: 0.95rem;
  border: 1px solid var(--accent-border, #2c271f);
  background: #fff;
  border-radius: 3px;
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #4e483d);
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill-btn {
  background: #fff;
  border: 1px solid var(--accent-border, #2c271f);
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn:hover {
  background: #f0e6d2;
}

.pill-btn.active {
  background: var(--accent-dark, #191714);
  color: #fff;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85rem;
}

.btn-export {
  background: #2c271f;
  color: #fff;
}

/* Tables */
.table-container {
  background: #fff;
  border: 2px solid var(--accent-border, #2c271f);
  border-radius: 4px;
  overflow: hidden;
}

.table-summary-bar {
  background: var(--bg-parchment-light, #fbf7ee);
  padding: 10px 16px;
  font-size: 0.85rem;
  color: var(--text-muted, #4e483d);
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e0d7c3;
}

.table-responsive-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f7f1e4;
  padding: 12px 14px;
  font-size: 0.85rem;
  color: var(--text-dark, #1c1b18);
  border-bottom: 2px solid var(--accent-border, #2c271f);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5dac4;
  vertical-align: middle;
}

.data-table tr:hover td {
  background: #fdfbf7;
}

.table-empty {
  text-align: center;
  padding: 36px 14px !important;
  color: var(--text-muted, #4e483d);
  font-size: 1rem;
}

.cell-num {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-muted, #4e483d);
}

.athlete-name-cell {
  display: flex;
  flex-direction: column;
}

.athlete-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-dark, #1c1b18);
}

.athlete-nick {
  font-family: var(--font-condensed);
  font-size: 0.88rem;
  font-weight: 700;
  font-style: italic;
  color: #c46d1b;
  letter-spacing: 0.3px;
}

.whatsapp-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2e7d32;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.whatsapp-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}

/* Tag Badges */
.tag-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 3px;
  white-space: nowrap;
}

.tag-run {
  background: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #a5d6a7;
}

.tag-walk {
  background: #e3f2fd;
  color: #0d47a1;
  border: 1px solid #90caf9;
}

.tag-beer {
  background: #fff8e1;
  color: #b78103;
  border: 1px solid #ffe082;
}

.tag-nobeer {
  background: #eceff1;
  color: #455a64;
  border: 1px solid #cfd8dc;
}

.checkin-badge-btn {
  background: #f5f5f5;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.checkin-badge-btn.is-checked {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #4caf50;
}

.action-buttons-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.btn-row-action {
  background: #f0e6d2;
  border: 1px solid var(--accent-border, #2c271f);
  width: 34px;
  height: 34px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-dark, #1c1b18);
  transition: all 0.2s;
  text-decoration: none;
}

.btn-row-action:hover {
  transform: translateY(-1px);
}

.btn-wa {
  background: #25d366;
  color: #fff;
  border-color: #128c7e;
}

.btn-delete:hover {
  background: #ffebee;
  color: #c62828;
  border-color: #c62828;
}

/* Waitlist Styles */
.waitlist-rank-badge {
  background: var(--accent-dark, #191714);
  color: #fff;
  padding: 4px 9px;
  border-radius: 3px;
  font-size: 0.85rem;
}

.waitlist-banner-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-muted, #4e483d);
}

.status-select {
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 3px;
  border: 1px solid var(--accent-border, #2c271f);
  background: #fff;
}

.status-waiting {
  background: #fff8e1;
  color: #f57f17;
}

.status-called {
  background: #e1f5fe;
  color: #0288d1;
}

.status-registered {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-cancelled {
  background: #ffebee;
  color: #c62828;
}

.btn-promote {
  background: var(--accent-gold, #d9822b);
  color: #fff;
  border: 1px solid var(--accent-border, #2c271f);
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 900;
  border-radius: 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-promote:hover {
  background: #b5671a;
}

/* Sponsors Tab */
.sponsor-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--text-dark, #1c1b18);
}

.sponsors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.span-all {
  grid-column: 1 / -1;
}

.sponsor-sub-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.sub-tab-btn {
  background: var(--bg-parchment-light, #fbf7ee);
  border: 2px solid var(--accent-border, #2c271f);
  color: var(--text-muted, #4e483d);
  padding: 10px 18px;
  font-size: 0.92rem;
  font-weight: 800;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.sub-tab-btn:hover {
  background: #f0e6d2;
  color: var(--text-dark, #1c1b18);
}

.sub-tab-btn.active {
  background: var(--accent-dark, #191714);
  color: #fff;
  border-color: var(--accent-dark, #191714);
}

.publish-toast {
  background: #e8f5e9;
  border: 2px solid #2e7d32;
  color: #1b5e20;
  padding: 12px 18px;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.1);
}

.publish-toast .toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-close-btn {
  background: none;
  border: none;
  color: #1b5e20;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 4px;
}

.published-site-badge {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.btn-sync-site {
  background: #2e7d32;
  color: #fff;
  border: 1px solid #1b5e20;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-sync-site:hover {
  background: #1b5e20;
}

.official-sponsors-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted, #4e483d);
  font-size: 0.9rem;
}

.sponsor-thumb-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px;
}

.sponsor-table-thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.sponsor-table-placeholder {
  font-size: 1.3rem;
  color: #aaa;
}

.sponsor-web-link {
  color: #1e88e5;
  text-decoration: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sponsor-web-link:hover {
  text-decoration: underline;
}

.empty-box {
  background: #fff;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #bba98e;
  color: var(--text-muted, #4e483d);
  font-size: 1.05rem;
}

.sponsor-card {
  background: #fff;
  border: 2px solid var(--accent-border, #2c271f);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  border-radius: 3px;
  box-shadow: 4px 4px 0px rgba(44, 39, 31, 0.2);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.sponsor-card.border-pending {
  border-left: 6px solid #e69128;
}

.sponsor-card.border-approved {
  border-left: 6px solid #1e88e5;
}

.sponsor-card.border-finished {
  border-left: 6px solid #2e7d32;
}

.sponsor-card.border-rejected {
  border-left: 6px solid #c62828;
}

.sponsor-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.sponsor-brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.sponsor-card-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px;
  background: #fff;
  flex-shrink: 0;
}

.sponsor-logo-placeholder {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0e6d2;
  border: 1px solid #d5c3a1;
  border-radius: 4px;
  font-size: 1.5rem;
  color: #796c56;
  flex-shrink: 0;
}

.sponsor-company {
  font-size: 1.15rem;
  color: var(--text-dark, #1c1b18);
  margin-bottom: 2px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.sponsor-contact {
  font-size: 0.85rem;
  color: var(--text-muted, #4e483d);
}

.sponsor-status-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.status-lbl {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted, #4e483d);
}

.sponsor-status-select {
  padding: 6px 8px;
  font-size: 0.85rem;
  font-weight: 800;
  border-radius: 3px;
  border: 1px solid var(--accent-border, #2c271f);
  max-width: 100%;
}

.sponsor-details-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  background: #fdfbf7;
  border: 1px solid #f0e6d2;
  padding: 10px;
  border-radius: 3px;
  overflow-wrap: anywhere;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-name {
  color: var(--text-muted, #4e483d);
  font-weight: 700;
  white-space: nowrap;
}

.detail-val {
  color: var(--text-dark, #1c1b18);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.activations-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.act-tag {
  background: #f0e6d2;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.8rem;
}

.detail-notes {
  margin-top: 4px;
}

.notes-text {
  font-style: italic;
  color: #555;
  margin-top: 2px;
}

.sponsor-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid #f0e6d2;
  padding-top: 10px;
  flex-wrap: wrap;
}

.sponsor-date {
  font-size: 0.8rem;
}

.sponsor-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-wa-full {
  background: #25d366;
  color: #fff;
  border: 1px solid #128c7e;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Checkin Tab */
.checkin-hero {
  background: var(--bg-parchment-light, #fbf7ee);
  border: 2px solid var(--accent-border, #2c271f);
  padding: 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkin-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
}

.checkin-stat-box {
  display: flex;
  flex-direction: column;
}

.checkin-num {
  font-size: 2.4rem;
  font-weight: 900;
}

.checkin-lbl {
  font-size: 0.9rem;
  color: var(--text-muted, #4e483d);
}

.checkin-search-bar {
  width: 100%;
}

.checkin-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 1.15rem;
  border: 2px solid var(--accent-border, #2c271f);
  background: #fff;
  border-radius: 3px;
}

.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkin-row {
  background: #fff;
  border: 2px solid var(--accent-border, #2c271f);
  padding: 14px 18px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.2s;
}

.checkin-row.checked-done {
  background: #f1f8e9;
  border-color: #558b2f;
}

.checkin-athlete-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkin-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkin-meta-line {
  font-size: 0.85rem;
  color: var(--text-muted, #4e483d);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-checkin-big {
  background: var(--accent-gold, #d9822b);
  color: #fff;
  border: 2px solid var(--accent-border, #2c271f);
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 900;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  min-height: 48px;
}

.btn-checkin-big:hover {
  transform: scale(1.02);
}

.btn-checkin-active {
  background: #2e7d32;
  border-color: #1b5e20;
}

/* Sub Modals */
.modal-backdrop-inner {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.sub-modal-card {
  background: var(--bg-parchment-light, #fbf7ee);
  border: 4px solid var(--accent-border, #2c271f);
  box-shadow: 8px 8px 0px #000;
  width: 100%;
  max-width: 480px;
  padding: 24px;
  border-radius: 4px;
}

.sub-modal-title {
  font-size: 1.3rem;
  color: var(--text-dark, #1c1b18);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-modal-desc {
  font-size: 0.9rem;
  color: var(--text-muted, #4e483d);
  margin-bottom: 16px;
}

.sub-modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.form-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-dark, #1c1b18);
}

.form-input {
  padding: 9px 12px;
  font-size: 1rem;
  border: 1px solid var(--accent-border, #2c271f);
  background: #fff;
  border-radius: 2px;
}

.modal-error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn-cancel {
  background: transparent;
  border: none;
  color: var(--text-muted, #4e483d);
  padding: 8px 14px;
  font-weight: 700;
  cursor: pointer;
}

/* Danger Modal Specifics */
.modal-danger {
  border-color: #b71c1c;
}

.danger-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.danger-icon {
  font-size: 1.8rem;
  color: #c62828;
}

.danger-title {
  font-size: 1.3rem;
  color: #b71c1c;
}

.danger-warning {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark, #1c1b18);
  margin-bottom: 6px;
}

.target-item-box {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  padding: 8px 12px;
  border-radius: 3px;
  font-size: 1rem;
  margin-bottom: 12px;
  color: #b71c1c;
}

.danger-note {
  font-size: 0.85rem;
  color: var(--text-muted, #4e483d);
  line-height: 1.35;
}

.btn-danger-confirm {
  background: #c62828;
  color: #fff;
  border: 2px solid #b71c1c;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 900;
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-danger-confirm:hover {
  background: #b71c1c;
}

.promote-info-box {
  background: #fdfbf7;
  border: 1px solid #e0d7c3;
  padding: 12px;
  border-radius: 3px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==========================================================================
   MOBILE RESPONSIVENESS OPTIMIZATIONS (MOBILE-FIRST POLISH)
   ========================================================================== */
@media (max-width: 768px) {
  /* Header & Navigation */
  .staff-header {
    padding: 10px 12px;
    gap: 8px;
  }

  .header-left {
    gap: 8px;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .btn-back-site {
    padding: 6px 10px;
    font-size: 0.8rem;
    gap: 6px;
  }

  .btn-text-desktop {
    display: none;
  }

  .btn-text-mobile {
    display: inline;
  }

  .brand-info {
    gap: 6px;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .brand-title {
    font-size: 1.05rem;
    gap: 5px;
  }

  .brand-title-full {
    display: none;
  }

  .brand-title-short {
    display: inline;
  }

  .db-status-pill {
    font-size: 0.72rem;
    padding: 2px 7px;
    gap: 4px;
  }

  .status-text-full {
    display: none;
  }

  .status-text-short {
    display: inline;
  }

  .header-right {
    gap: 6px;
  }

  .btn-tool {
    padding: 6px 10px;
    font-size: 0.8rem;
    min-height: 36px;
  }

  .btn-label-desktop {
    display: none;
  }

  /* Sticky Navigation Tabs (100% largura, 5 colunas sem nenhum scroll horizontal!) */
  .tabs-scroll-wrapper {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    width: 100%;
    padding: 0;
    gap: 0;
    overflow-x: hidden;
  }

  .tab-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 1px 7px;
    font-size: 0.68rem;
    gap: 3px;
    min-height: 52px;
    width: 100%;
    position: relative;
    text-align: center;
    border-bottom-width: 3px;
  }

  .tab-btn i {
    font-size: 1.05rem;
  }

  .tab-label-desktop {
    display: none;
  }

  .tab-label-mobile {
    display: block;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
  }

  .tab-badge {
    font-size: 0.62rem;
    padding: 1px 4px;
    border-radius: 6px;
    position: absolute;
    top: 4px;
    right: 50%;
    transform: translateX(16px);
  }

  .staff-content-body {
    padding: 12px 8px 80px;
  }

  /* KPIs / Overview */
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .sponsor-pipeline-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .pipe-arrow {
    display: none;
  }

  .pipe-step {
    min-width: 0;
    padding: 10px 8px;
  }

  .pipe-num {
    font-size: 1.35rem;
  }

  /* Toolbars & Filters (Eliminação total de scroll horizontal nos botões) */
  .pane-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 12px;
    gap: 10px;
  }

  .search-wrap {
    min-width: 100%;
  }

  /* Oculta os botões em linha que forçavam scroll horizontal */
  .desktop-filters {
    display: none !important;
  }

  /* Dropdown de status dos Patrocínios em 100% de largura */
  .mobile-filter-select-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  /* Dropdowns de modalidade e chopp em grid 2 colunas */
  .mobile-athlete-filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }

  .mobile-select-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .mobile-filter-dropdown {
    width: 100%;
    padding: 10px 12px;
    font-size: 0.88rem;
    font-weight: 700;
    border: 1.5px solid var(--accent-border, #2c271f);
    border-radius: 4px;
    background: #fff;
    color: var(--text-dark, #1c1b18);
  }

  .mobile-select-label {
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--text-muted, #4e483d);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .toolbar-actions {
    justify-content: stretch;
    width: 100%;
    gap: 8px;
  }

  .toolbar-actions button {
    flex: 1;
    justify-content: center;
  }

  /* Table Container vs Mobile Cards */
  .table-responsive-wrapper {
    display: none; /* Em mobile substitui por cards fluidos */
  }

  .mobile-cards-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .mobile-data-card {
    background: #fff;
    border: 1.5px solid var(--accent-border, #2c271f);
    border-radius: 4px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 2px 2px 0px rgba(44, 39, 31, 0.15);
    box-sizing: border-box;
    width: 100%;
    transition: all 0.2s;
  }

  .card-checked-highlight {
    background: #f7fcf5;
    border-color: #2e7d32;
  }

  .mobile-card-top-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .mobile-card-identity {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .mobile-pos-badge {
    font-size: 0.82rem;
    font-weight: 900;
    color: var(--text-muted, #4e483d);
    background: #f0e6d2;
    padding: 3px 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .mobile-athlete-name {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-dark, #1c1b18);
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .mobile-card-quick-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .mobile-card-pills-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mobile-phone-text {
    font-size: 0.8rem;
    color: var(--text-muted, #4e483d);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .mobile-card-action-bar {
    margin-top: 2px;
  }

  .mobile-checkin-btn {
    width: 100%;
    min-height: 44px;
    font-size: 0.92rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 3px;
    cursor: pointer;
    background: #f5f5f5;
    border: 1.5px solid #ccc;
    color: var(--text-dark, #1c1b18);
    transition: all 0.2s;
  }

  .mobile-checkin-btn.is-checked {
    background: #e8f5e9;
    color: #2e7d32;
    border-color: #2e7d32;
  }

  .mobile-status-lbl {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-muted, #4e483d);
    margin-bottom: 2px;
  }

  .mobile-card-status-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mobile-card-status-row .status-select {
    width: 100%;
    padding: 8px;
    font-size: 0.88rem;
  }

  .mobile-card-footer-split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px solid #f0e6d2;
    padding-top: 8px;
  }

  .mobile-sponsor-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .mobile-sponsor-link {
    font-size: 0.85rem;
    overflow-wrap: anywhere;
  }

  .w-full {
    width: 100%;
    justify-content: center;
  }

  /* Sponsors Sub-nav & Cards */
  .sponsor-sub-nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    margin-bottom: 8px;
  }

  .sub-tab-btn {
    padding: 10px 8px;
    font-size: 0.8rem;
    justify-content: center;
    text-align: center;
    white-space: normal;
  }

  .sponsors-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .sponsor-card {
    padding: 14px;
    gap: 12px;
  }

  .sponsor-card-top {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .sponsor-brand-box {
    width: 100%;
  }

  .sponsor-status-box {
    align-items: stretch;
    width: 100%;
  }

  .sponsor-status-select {
    width: 100%;
    padding: 8px 10px;
    font-size: 0.88rem;
  }

  .sponsor-card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .sponsor-footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }

  .sponsor-footer-actions .btn-sync-site,
  .sponsor-footer-actions .btn-wa-full {
    flex: 1;
    justify-content: center;
    font-size: 0.85rem;
    padding: 8px 10px;
  }

  /* Check-in Tab */
  .checkin-hero {
    padding: 14px;
    gap: 12px;
  }

  .checkin-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .checkin-num {
    font-size: 1.6rem;
  }

  .checkin-lbl {
    font-size: 0.78rem;
  }

  .checkin-input {
    padding: 12px;
    font-size: 0.95rem;
  }

  .checkin-row {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 10px;
  }

  .checkin-action-wrap {
    width: 100%;
  }

  .btn-checkin-big {
    width: 100%;
    min-height: 48px;
    justify-content: center;
    font-size: 0.95rem;
  }

  /* Modals */
  .modal-backdrop-inner {
    padding: 12px;
  }

  .sub-modal-card {
    max-height: 88vh;
    overflow-y: auto;
    padding: 20px 16px;
    width: 100%;
    box-shadow: 4px 4px 0px #000;
  }

  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sub-modal-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .sub-modal-actions button {
    width: 100%;
    justify-content: center;
  }

  /* Login Screen */
  .staff-login-screen {
    padding: 12px;
  }

  .staff-login-card {
    padding: 30px 18px 24px;
  }

  .login-title {
    font-size: 1.4rem;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .form-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
