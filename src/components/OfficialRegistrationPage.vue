<template>
  <div class="official-reg-page">
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

    <main class="container reg-main-content registration-main">
      <template v-if="paymentOrder"
        ><p
          v-if="checkoutNotice"
          class="auth-error-banner font-condensed"
          role="status"
        >
          {{ checkoutNotice }}
        </p>
        <PaymentStatusPage :order-id="paymentOrder" @go-home="$emit('go-home')"
      /></template>
      <PublicRegistrationStatus
        v-else-if="publicLookup"
        :key="publicLookup.phone"
        :phone="publicLookup.phone"
        :initial-status="publicLookup.publicStatus"
        @back="
          publicLookup = null;
          lookupOpen = true;
        "
        @resume="paymentOrder = $event"
      />
      <section
        v-else-if="consultationOnly"
        class="auth-barrier-section consultation-page"
        aria-labelledby="consultation-title"
      >
        <div class="vintage-card auth-card">
          <div class="auth-badge font-condensed">
            <i class="fa-solid fa-ticket" aria-hidden="true"></i> INSCRIÇÕES
            BEER RUN
          </div>
          <div class="auth-header">
            <div class="auth-icon-circle">
              <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
            </div>
            <div>
              <h1 id="consultation-title" class="auth-title font-slab">
                CONSULTE SUA INSCRIÇÃO
              </h1>
              <p class="auth-subtitle font-condensed">
                Informe o WhatsApp usado na inscrição para continuar o pagamento
                ou consultar seu pedido.
              </p>
            </div>
          </div>
          <div class="auth-form-box lookup-panel">
            <p
              v-if="lookupMessage"
              role="status"
              class="auth-error-banner font-condensed"
            >
              {{ lookupMessage }}
            </p>
            <form class="auth-form" @submit.prevent="lookupRegistration">
              <div class="form-group">
                <label for="lookup-phone" class="auth-label font-condensed"
                  >WHATSAPP CADASTRADO</label
                >
                <div class="input-with-button lookup-controls">
                  <input
                    id="lookup-phone"
                    v-model="lookupPhone"
                    type="tel"
                    autocomplete="tel-national"
                    inputmode="tel"
                    aria-describedby="consultation-phone-help"
                    maxlength="15"
                    required
                    placeholder="(35) 99999-9999"
                    class="vintage-input auth-input font-condensed"
                    :disabled="lookupBusy"
                    @input="
                      lookupPhone = formatPhone($event.target.value);
                      lookupMessage = '';
                      lookupNotFound = false;
                    "
                  />
                  <button
                    type="submit"
                    class="btn-vintage btn-auth font-slab"
                    :disabled="lookupBusy"
                  >
                    <i
                      :class="
                        lookupBusy
                          ? 'fa-solid fa-spinner fa-spin'
                          : 'fa-solid fa-magnifying-glass'
                      "
                      aria-hidden="true"
                    ></i>
                    <span>{{
                      lookupBusy ? "CONSULTANDO..." : "CONSULTAR INSCRIÇÃO"
                    }}</span>
                  </button>
                </div>
              </div>
              <p
                id="consultation-phone-help"
                class="auth-phone-help font-condensed"
              >
                Use o mesmo número da inscrição, com DDD.
              </p>
              <a
                v-if="lookupNotFound"
                href="#inscricao"
                class="link-btn font-condensed"
                >Fazer minha inscrição →</a
              >
            </form>
            <div class="auth-footer-help font-condensed">
              <span>Precisa de ajuda com sua inscrição?</span>
              <div class="auth-help-actions">
                <button
                  type="button"
                  class="link-btn"
                  @click="$emit('go-home')"
                >
                  ← Acessar Página Inicial
                </button>
                <a
                  href="https://wa.me/5535997500430?text=Preciso%20de%20ajuda%20com%20minha%20inscri%C3%A7%C3%A3o%20na%20Beer%20Run."
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link-btn wa-help"
                >
                  <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Falar
                  com a Organização
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div v-else class="reg-container">
        <details
          v-if="!hideLookupPanel"
          class="auth-form-box lookup-panel"
          :open="lookupOpen"
          @toggle="lookupOpen = $event.target.open"
        >
          <summary class="auth-label font-condensed">
            JÁ ME INSCREVI • CONSULTAR OU PAGAR
          </summary>
          <form
            class="auth-form lookup-form"
            @submit.prevent="lookupRegistration"
          >
            <label class="auth-label font-condensed" for="lookup-phone"
              >WHATSAPP CADASTRADO</label
            >
            <div class="input-with-button lookup-controls">
              <input
                id="lookup-phone"
                v-model="lookupPhone"
                class="vintage-input auth-input font-condensed"
                type="tel"
                autocomplete="tel-national"
                inputmode="tel"
                maxlength="15"
                required
                placeholder="(35) 99999-9999"
                @input="lookupPhone = formatPhone($event.target.value)"
              />
              <button
                class="btn-vintage btn-auth font-slab"
                :disabled="lookupBusy"
              >
                {{ lookupBusy ? "CONSULTANDO..." : "CONSULTAR INSCRIÇÃO" }}
              </button>
            </div>
            <p
              v-if="lookupMessage"
              role="status"
              class="auth-phone-help font-condensed"
            >
              {{ lookupMessage }}
            </p>
          </form>
        </details>
        <p
          v-if="draftRestored"
          class="draft-resume-box font-condensed"
          role="status"
        >
          PROGRESSO RECUPERADO • Confira seus dados antes de pagar.
        </p>
        <div
          class="wizard-stepper font-condensed"
          aria-label="Etapas da inscrição"
        >
          <button
            v-for="(item, index) in steps"
            :key="item.id"
            type="button"
            :class="[
              'step-tab',
              { active: step === index + 1, completed: step > index + 1 },
            ]"
            :disabled="busy || index + 1 > furthestStep"
            @click="goToStep(index + 1)"
            :aria-label="`Etapa ${index + 1}: ${item.label}`"
            :aria-current="step === index + 1 ? 'step' : undefined"
          >
            <span class="step-badge">{{ index + 1 }}</span
            ><span class="step-name">{{ item.label }}</span>
          </button>
        </div>
        <form
          class="reg-form registration-form"
          novalidate
          @submit.prevent="submitStep"
        >
          <fieldset class="registration-fields" :disabled="busy">
            <legend class="sr-only">Inscrição Beer Run dos Gordos</legend>
            <div
              v-if="Object.keys(errors).length"
              class="error-banner font-condensed"
              role="alert"
            >
              {{ Object.values(errors).join(" ") }}
            </div>
            <div
              v-show="step === 1"
              class="form-section-card step-card"
              aria-labelledby="kit-title"
            >
              <div class="step-header">
                <h2
                  id="kit-title"
                  tabindex="-1"
                  class="section-title font-slab"
                >
                  <span class="step-num font-condensed">1</span> ESCOLHA SEU KIT
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 1 de 5 • Selecione sua modalidade e personalize seu kit.
                </p>
              </div>

              <section
                class="font-condensed registration-offer"
                aria-label="Benefícios e valores da inscrição"
              >
                <p class="offer-benefits">
                  <strong>Nas duas opções, você leva:</strong><br />camiseta,
                  medalha, copo e espetinhos pós prova.
                </p>
                <ul class="offer-extras">
                  <li v-for="benefit in kitExtras" :key="benefit">
                    {{ benefit }}
                  </li>
                </ul>
                <dl class="offer-prices">
                  <div>
                    <dt>SEM CHOPP</dt>
                    <dd class="font-slab">
                      {{ money(registrationPrice(false)) }}
                    </dd>
                  </div>
                  <div>
                    <dt>COM CHOPP</dt>
                    <dd class="font-slab">
                      {{ money(registrationPrice(true)) }}
                    </dd>
                  </div>
                </dl>
                <AthleteKitPreview />
              </section>
              <div class="form-grid kit-grid">
                <!-- MODALIDADE (2 COLUNAS LADO A LADO) -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed"
                    >MODALIDADE NA PROVA *</label
                  >
                  <div class="choice-cards-row font-condensed">
                    <label
                      :class="[
                        'choice-card',
                        { selected: form.modality === 'corrida' },
                      ]"
                    >
                      <input
                        type="radio"
                        v-model="form.modality"
                        value="corrida"
                        name="modality"
                        class="sr-only"
                        id="reg-modality"
                        :aria-invalid="!!errors.modality"
                      />
                      <div class="choice-icon">🏃‍♂️</div>
                      <div class="choice-text">
                        <strong>CORRIDA</strong>
                        <span>6,37 km livre</span>
                      </div>
                    </label>

                    <label
                      :class="[
                        'choice-card',
                        { selected: form.modality === 'caminhada' },
                      ]"
                    >
                      <input
                        type="radio"
                        v-model="form.modality"
                        value="caminhada"
                        name="modality"
                        class="sr-only"
                        id="reg-modality-walk"
                        :aria-invalid="!!errors.modality"
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
                    <span class="field-desc"
                      >(Artigo 6.3: Facultativo e restrito a +18)</span
                    >
                  </label>
                  <div class="choice-cards-row font-condensed">
                    <label
                      :class="[
                        'choice-card',
                        { selected: form.drinksBeer === true },
                      ]"
                    >
                      <input
                        type="radio"
                        :checked="form.drinksBeer === true"
                        name="beer"
                        value="true"
                        :disabled="isMinor"
                        @change="form.drinksBeer = true"
                        class="sr-only"
                      />
                      <div class="choice-icon">🍺</div>
                      <div class="choice-text">
                        <strong>QUERO CHOPP!</strong>
                        <span>Kit completo por R$ 100</span>
                      </div>
                    </label>

                    <label
                      :class="[
                        'choice-card',
                        { selected: form.drinksBeer === false },
                      ]"
                    >
                      <input
                        type="radio"
                        :checked="form.drinksBeer === false"
                        name="beer"
                        value="false"
                        @change="form.drinksBeer = false"
                        class="sr-only"
                      />
                      <div class="choice-icon">💧</div>
                      <div class="choice-text">
                        <strong>SEM ÁLCOOL</strong>
                        <span>Kit completo por R$ 90</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- ESPETINHOS DA CHEGADA COM STEPPERS (+ / -) E VEGETARIANO -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    CHURRASCO DE CHEGADA: 2 ESPETINHOS 🍢 *
                    <span class="field-desc"
                      >(Defina a combinação dos seus 2 espetinhos de
                      chegada)</span
                    >
                  </label>

                  <div class="skewer-box">
                    <div class="skewer-rows-list">
                      <!-- Linha 1: Carne -->
                      <div
                        class="skewer-row-item"
                        :class="{ 'is-disabled': skewerIsVegetarian }"
                      >
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
                          <span class="stepper-count font-slab">{{
                            skewerIsVegetarian ? 0 : skewerCarne
                          }}</span>
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
                      <div
                        class="skewer-row-item"
                        :class="{ 'is-disabled': skewerIsVegetarian }"
                      >
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
                          <span class="stepper-count font-slab">{{
                            skewerIsVegetarian ? 0 : skewerFrango
                          }}</span>
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
                      <label
                        class="skewer-row-item skewer-row-veg"
                        :class="{ active: skewerIsVegetarian }"
                      >
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
                            <small
                              >Não consumo carne / refeição sem carne</small
                            >
                          </div>
                        </div>
                        <div class="veg-toggle-action">
                          <span
                            class="veg-switch"
                            :class="{ checked: skewerIsVegetarian }"
                          >
                            <i
                              v-if="skewerIsVegetarian"
                              class="fa-solid fa-check"
                            ></i>
                          </span>
                        </div>
                      </label>
                    </div>

                    <!-- Resumo inline sutil -->
                    <div class="skewer-summary-bar font-condensed">
                      <span v-if="skewerIsVegetarian" class="text-veg">
                        <i class="fa-solid fa-seedling"></i> Opção Vegetariana
                        confirmada (sem carne)
                      </span>
                      <span v-else class="text-standard">
                        <i class="fa-solid fa-utensils"></i> Seleção:
                        <strong>{{
                          formatSkewerLabel(form.skewerChoice)
                        }}</strong>
                        (2 espetinhos inclusos)
                      </span>
                    </div>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label for="shirt-model" class="form-label font-condensed"
                    >MODELO DA CAMISETA 👕 *</label
                  >
                  <select
                    id="shirt-model"
                    v-model="form.shirtModel"
                    class="vintage-input font-condensed"
                    required
                    @change="form.shirtSize = ''"
                    :aria-invalid="!!errors.shirtModel"
                  >
                    <option disabled value="">Selecione o modelo</option>
                    <option
                      v-for="model in SHIRT_MODELS"
                      :key="model.value"
                      :value="model.value"
                    >
                      {{ model.label }}
                    </option>
                  </select>
                </div>
                <div class="form-group full-width">
                  <label for="shirt-size" class="form-label font-condensed"
                    >TAMANHO DA CAMISETA 👕 *</label
                  >
                  <select
                    id="shirt-size"
                    v-model="form.shirtSize"
                    class="vintage-input font-condensed"
                    required
                    :disabled="!form.shirtModel"
                    aria-describedby="shirt-size-help shirt-measurements"
                    :aria-invalid="!!errors.shirtSize"
                  >
                    <option disabled value="">
                      {{
                        form.shirtModel
                          ? "Selecione o tamanho"
                          : "Selecione primeiro o modelo"
                      }}
                    </option>
                    <option v-for="[size] in sizes" :key="size" :value="size">
                      {{ size }}
                    </option>
                  </select>
                </div>
                <div class="form-group full-width shirt-guide-group">
                  <small id="shirt-size-help" class="field-desc font-condensed"
                    >Camiseta incluída na inscrição de todos os atletas. Confira
                    as medidas antes de escolher.</small
                  >
                  <p
                    id="shirt-measurements"
                    class="font-condensed"
                    aria-live="polite"
                  >
                    <template v-if="measurements"
                      >{{
                        formatShirtSelection(form.shirtModel, form.shirtSize)
                      }}: {{ measurements[1] }} cm de altura ×
                      {{ measurements[2] }} cm de largura.</template
                    >
                  </p>
                  <ShirtSizeGuide
                    :model="form.shirtModel"
                    :size="form.shirtSize"
                  />
                </div>
              </div>
            </div>
            <div
              v-show="step === 2"
              class="form-section-card step-card"
              aria-labelledby="details-title"
            >
              <div class="step-header">
                <h2
                  id="details-title"
                  tabindex="-1"
                  class="section-title font-slab"
                >
                  <span class="step-num font-condensed">2</span> DADOS PESSOAIS
                  DO ATLETA
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 2 de 5 • Confirme sua identificação para o número de
                  peito e classificação
                </p>
              </div>

              <div class="form-grid">
                <!-- NOME COMPLETO -->
                <div class="form-group full-width">
                  <label class="form-label font-condensed">
                    NOME COMPLETO *
                  </label>
                  <div class="input-locked-wrapper">
                    <input
                      type="text"
                      v-model="form.name"
                      :disabled="busy"
                      required
                      maxlength="120"
                      class="vintage-input font-condensed"
                      placeholder="Informe seu nome completo"
                      id="reg-name"
                      :aria-invalid="!!errors.name"
                      aria-label="Nome completo"
                      autocomplete="name"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    APELIDO / NOME DE GUERRA
                  </label>
                  <input
                    type="text"
                    v-model="form.nickname"
                    placeholder="Ex: Mestre Cervejeiro, Gordo Raiz..."
                    class="vintage-input font-condensed"
                    id="reg-nickname"
                    :aria-invalid="!!errors.nickname"
                    aria-label="Apelido opcional"
                    autocomplete="nickname"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    CPF *
                    <span class="field-desc"
                      >(para identificação e seguro atleta)</span
                    >
                  </label>
                  <input
                    type="text"
                    v-model="form.cpf"
                    @input="formatField('cpf')"
                    maxlength="14"
                    required
                    placeholder="000.000.000-00"
                    class="vintage-input font-condensed"
                    id="reg-cpf"
                    :aria-invalid="!!errors.cpf"
                    aria-label="CPF"
                    inputmode="numeric"
                  />
                </div>

                <div class="form-group">
                  <label for="reg-birthDate" class="form-label font-condensed">
                    DATA DE NASCIMENTO *
                  </label>
                  <BirthDateInput
                    v-model="form.birthDate"
                    required
                    class="vintage-input font-condensed"
                    id="reg-birthDate"
                    :aria-invalid="!!errors.birthDate"
                    aria-label="Data de nascimento"
                    aria-describedby="reg-birthDate-help"
                    :max="today"
                  />
                  <small id="reg-birthDate-help" class="field-desc font-condensed">
                    Digite dia, mês e ano. Ex.: 25/08/1990
                  </small>
                  <span
                    v-if="athleteAge !== null"
                    class="age-badge font-condensed"
                  >
                    Idade: <strong>{{ athleteAge }} anos</strong>
                    <span v-if="athleteAge < 18" class="text-warning">
                      (Menor de 18 anos - Proibido consumo de chopp)</span
                    >
                  </span>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    SEXO / GÊNERO *
                  </label>
                  <div
                    id="reg-gender"
                    tabindex="-1"
                    :aria-invalid="!!errors.gender"
                    class="toggle-options-row font-condensed"
                  >
                    <button
                      type="button"
                      :class="['toggle-pill', { active: form.gender === 'M' }]"
                      :aria-pressed="form.gender === 'M'"
                      @click="form.gender = 'M'"
                    >
                      <i class="fa-solid fa-mars"></i> MASCULINO
                    </button>
                    <button
                      type="button"
                      :class="['toggle-pill', { active: form.gender === 'F' }]"
                      :aria-pressed="form.gender === 'F'"
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
                    id="reg-cityState"
                    :aria-invalid="!!errors.cityState"
                    aria-label="Cidade e estado"
                    autocomplete="address-level2"
                  />
                </div>
              </div>
              <p v-if="isMinor" class="auth-phone-help font-condensed">
                Sua opção foi ajustada para sem álcool. Total:
                {{ money(registrationPrice(false)) }}.
              </p>
            </div>
            <div
              v-show="step === 3"
              class="form-section-card step-card"
              aria-labelledby="contact-title"
            >
              <div class="step-header">
                <h2
                  id="contact-title"
                  tabindex="-1"
                  class="section-title font-slab"
                >
                  <span class="step-num font-condensed">3</span> CONTATO &
                  EMERGÊNCIA
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 3 de 5 • Dados de segurança obrigatórios para
                  atendimento no percurso rural
                </p>
              </div>

              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label font-condensed">E-MAIL *</label>
                  <input
                    v-model="form.email"
                    type="email"
                    required
                    maxlength="254"
                    class="vintage-input font-condensed"
                    placeholder="voce@exemplo.com"
                    id="reg-email"
                    :aria-invalid="!!errors.email"
                    aria-label="E-mail"
                    autocomplete="email"
                  />
                </div>
                <!-- CELULAR / WHATSAPP (BLOQUEADO / READONLY) -->
                <div class="form-group">
                  <label class="form-label font-condensed">
                    CELULAR / WHATSAPP *
                  </label>
                  <div class="input-locked-wrapper">
                    <input
                      type="tel"
                      v-model="form.phone"
                      @input="formatField('phone')"
                      @blur="inspectPhone()"
                      autocomplete="tel-national"
                      inputmode="tel"
                      maxlength="15"
                      placeholder="(35) 99999-9999"
                      class="vintage-input font-condensed"
                      id="reg-phone"
                      :aria-invalid="!!errors.phone"
                      aria-label="WhatsApp com DDD"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    NOME DO CONTATO DE EMERGÊNCIA *
                    <span class="field-desc"
                      >(familiar ou amigo para sobreaviso)</span
                    >
                  </label>
                  <input
                    type="text"
                    v-model="form.emergencyContactName"
                    required
                    placeholder="Ex: Maria Silva (Esposa / Irmão / Amigo)"
                    class="vintage-input font-condensed"
                    id="reg-emergencyContactName"
                    :aria-invalid="!!errors.emergencyContactName"
                    aria-label="Nome do contato de emergência"
                    autocomplete="section-emergency name"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label font-condensed">
                    TELEFONE DO CONTATO DE EMERGÊNCIA *
                  </label>
                  <input
                    type="tel"
                    v-model="form.emergencyContactPhone"
                    @input="formatField('emergencyContactPhone')"
                    maxlength="15"
                    required
                    placeholder="(35) 99999-9999"
                    class="vintage-input font-condensed"
                    id="reg-emergencyContactPhone"
                    :aria-invalid="!!errors.emergencyContactPhone"
                    aria-label="Telefone do contato de emergência"
                    autocomplete="section-emergency tel-national"
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
                    id="reg-medicalNotes"
                    :aria-invalid="!!errors.medicalNotes"
                    aria-label="Observações médicas opcionais"
                  />
                </div>
              </div>
              <div
                v-if="existingRegistration"
                class="auth-error-banner existing-registration font-condensed"
                role="status"
              >
                <p>Este celular já possui uma inscrição.</p>
                <button
                  type="button"
                  class="link-btn"
                  @click="showExisting(existingRegistration)"
                >
                  Consultar ou continuar pagamento →
                </button>
              </div>
            </div>
            <div
              v-show="step === 4"
              class="form-section-card step-card"
              aria-labelledby="rules-title"
            >
              <div class="step-header">
                <h2
                  id="rules-title"
                  tabindex="-1"
                  class="section-title font-slab"
                >
                  <span class="step-num font-condensed">4</span> REGULAMENTO
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 4 de 5 • Leia as regras e confirme seu aceite antes de
                  revisar a inscrição.
                </p>
              </div>
              <div class="rules-summary-grid font-condensed">
                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-medal"></i></div>
                  <div>
                    <strong>Espírito da Prova</strong>
                    <p>
                      Recreativa, festiva e beneficente em prol do Natal
                      Solidário dos Gordos.
                    </p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon">
                    <i class="fa-solid fa-stopwatch"></i>
                  </div>
                  <div>
                    <strong>Sem Chip Eletrônico</strong>
                    <p>
                      Premiação simbólica apenas aos 3 primeiros gerais masc e
                      fem por ordem de chegada.
                    </p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon"><i class="fa-solid fa-road"></i></div>
                  <div>
                    <strong>Percurso Rural</strong>
                    <p>
                      6,37 km com terra, subidas e descidas no Sítio dos Gordos
                      em Natércia/MG.
                    </p>
                  </div>
                </div>

                <div class="rule-box">
                  <div class="rule-icon">
                    <i class="fa-solid fa-beer-mug-empty"></i>
                  </div>
                  <div>
                    <strong>Chopp Consciente</strong>
                    <p>
                      Consumo facultativo, proibido para menores de 18 anos. Se
                      beber, não dirija.
                    </p>
                  </div>
                </div>
              </div>

              <div class="pdf-viewer-toolbar">
                <a
                  class="btn-pdf-action font-condensed highlight"
                  href="/regulamento-beer-run-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  ><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> LER
                  REGULAMENTO COMPLETO</a
                >
              </div>
              <!-- Checkbox de Aceite Obrigatório -->
              <div class="terms-acceptance-box">
                <label class="terms-checkbox-label font-condensed">
                  <input
                    type="checkbox"
                    v-model="form.acceptedTerms"
                    required
                    class="vintage-checkbox"
                    :disabled="busy"
                    id="reg-acceptedTerms"
                    :aria-invalid="!!errors.acceptedTerms"
                    aria-label="Aceite do regulamento"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="terms-text">
                    <strong
                      >Li e concordo com o Regulamento da Beer Run dos Gordos
                      2026.</strong
                    >
                    Declaro estar apto(a) para participar e autorizo o uso da
                    minha imagem conforme o regulamento.
                  </span>
                </label>
              </div>
            </div>
            <div
              v-show="step === 5"
              class="form-section-card step-card payment-review-card"
              aria-labelledby="review-title"
            >
              <div class="step-header">
                <h2
                  id="review-title"
                  tabindex="-1"
                  class="section-title font-slab"
                >
                  <span class="step-num font-condensed">5</span> RESUMO &
                  PAGAMENTO
                </h2>
                <p class="step-subtitle font-condensed">
                  Etapa 5 de 5 • Confira seus dados, kit e valor total antes de
                  pagar.
                </p>
              </div>

              <section
                class="registration-kit-summary font-condensed"
                aria-label="Kit selecionado"
              >
                <div class="review-section-heading">
                  <h3 class="font-slab">Sua inscrição inclui</h3>
                  <button
                    type="button"
                    class="review-edit-button"
                    :disabled="busy"
                    @click="editStep(1)"
                  >
                    Editar escolhas
                  </button>
                </div>
                <dl class="review-kit-grid">
                  <div>
                    <dt>Modalidade</dt>
                    <dd>
                      {{
                        form.modality === "caminhada" ? "Caminhada" : "Corrida"
                      }}
                      · 6,37 km
                    </dd>
                  </div>
                  <div>
                    <dt>Camiseta</dt>
                    <dd>
                      {{
                        formatShirtSelection(form.shirtModel, form.shirtSize)
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>Churrasco de chegada</dt>
                    <dd>{{ formatSkewerLabel(form.skewerChoice) }}</dd>
                  </div>
                  <div>
                    <dt>Hidratação</dt>
                    <dd>
                      {{
                        form.drinksBeer
                          ? "Com chopp artesanal"
                          : "Sem álcool · água e refrigerante"
                      }}
                    </dd>
                  </div>
                </dl>
                <p class="review-extras-title">
                  Também incluído na sua inscrição:
                </p>
                <ul class="offer-extras review-extras">
                  <li v-for="benefit in kitExtras" :key="benefit">
                    {{ benefit }}
                  </li>
                </ul>
              </section>

              <section
                class="registration-kit-summary font-condensed"
                aria-label="Dados do atleta"
              >
                <div class="review-section-heading">
                  <h3 class="font-slab">Dados do atleta</h3>
                  <button
                    type="button"
                    class="review-edit-button"
                    :disabled="busy"
                    @click="editStep(2)"
                  >
                    Editar dados
                  </button>
                </div>
                <dl class="review-kit-grid">
                  <div>
                    <dt>Nome completo</dt>
                    <dd>{{ form.name }}</dd>
                  </div>
                  <div v-if="form.nickname">
                    <dt>Apelido</dt>
                    <dd>{{ form.nickname }}</dd>
                  </div>
                  <div>
                    <dt>CPF</dt>
                    <dd>{{ form.cpf }}</dd>
                  </div>
                  <div>
                    <dt>Nascimento</dt>
                    <dd>{{ form.birthDate.split("-").reverse().join("/") }}</dd>
                  </div>
                  <div>
                    <dt>Sexo / gênero</dt>
                    <dd>
                      {{
                        { M: "Masculino", F: "Feminino", O: "Outro" }[
                          form.gender
                        ]
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>Cidade e estado</dt>
                    <dd>{{ form.cityState }}</dd>
                  </div>
                </dl>
              </section>
              <section
                class="registration-kit-summary font-condensed"
                aria-label="Contato e emergência"
              >
                <div class="review-section-heading">
                  <h3 class="font-slab">Contato e emergência</h3>
                  <button
                    type="button"
                    class="review-edit-button"
                    :disabled="busy"
                    @click="editStep(3)"
                  >
                    Editar contato
                  </button>
                </div>
                <dl class="review-kit-grid">
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{{ form.phone }}</dd>
                  </div>
                  <div>
                    <dt>E-mail</dt>
                    <dd>{{ form.email }}</dd>
                  </div>
                  <div>
                    <dt>Contato de emergência</dt>
                    <dd>{{ form.emergencyContactName }}</dd>
                  </div>
                  <div>
                    <dt>Telefone de emergência</dt>
                    <dd>{{ form.emergencyContactPhone }}</dd>
                  </div>
                  <div v-if="form.medicalNotes">
                    <dt>Observações médicas</dt>
                    <dd>{{ form.medicalNotes }}</dd>
                  </div>
                </dl>
              </section>
              <CouponEntry
                v-if="couponEligible"
                v-model="form.couponCode"
                :phone="form.phone"
                :beer="form.drinksBeer"
                :disabled="busy"
                :show-total="false"
                @quote="couponQuote = $event"
              />

              <section
                class="registration-total-card font-condensed"
                aria-label="Valores da inscrição"
                aria-live="polite"
              >
                <dl class="review-amounts">
                  <div>
                    <dt>
                      Inscrição
                      {{ form.drinksBeer ? "com chopp" : "sem chopp" }}
                    </dt>
                    <dd>{{ money(registrationPrice(form.drinksBeer)) }}</dd>
                  </div>
                  <div v-if="couponQuote" class="review-discount">
                    <dt>Desconto aplicado</dt>
                    <dd>− {{ money(couponQuote.discountAmount) }}</dd>
                  </div>
                  <div class="review-total">
                    <dt>Total a pagar</dt>
                    <dd class="font-slab">
                      {{
                        money(
                          couponQuote?.amount ??
                            registrationPrice(form.drinksBeer)
                        )
                      }}
                    </dd>
                  </div>
                </dl>
                <p>Todos os itens acima incluídos.</p>
              </section>
              <p
                v-if="couponNeedsApply"
                class="review-coupon-hint font-condensed"
                role="status"
              >
                Aplique o cupom ou apague o código para continuar.
              </p>
              <p class="review-payment-note font-condensed">
                Regulamento aceito.
                <button
                  type="button"
                  class="review-edit-button"
                  :disabled="busy"
                  @click="editStep(4)"
                >
                  Rever regulamento
                </button>
              </p>
              <div class="review-payment-note font-condensed">
                <i class="fa-solid fa-lock" aria-hidden="true"></i>
                <p>
                  Pagamento seguro pela InfinitePay. Inscrição confirmada após a
                  aprovação do pagamento.
                </p>
              </div>
            </div>
          </fieldset>
          <p
            v-if="submitError"
            class="error-banner font-condensed"
            role="alert"
          >
            {{ submitError }}
          </p>
          <div v-if="conflict" class="auth-error-banner font-condensed">
            <button
              type="button"
              class="link-btn"
              @click="
                lookupPhone = form.phone;
                lookupOpen = true;
                lookupRegistration();
              "
            >
              Consultar minha inscrição existente
            </button>
          </div>
          <div
            class="step-footer-actions registration-bottom-bar font-condensed"
            :class="{ 'is-first-step': step === 1 }"
          >
            <div class="running-total">
              <span>TOTAL DO SEU KIT</span
              ><strong class="font-slab">{{ money(total) }}</strong
              ><small v-if="couponQuote"
                >Desconto: {{ money(couponQuote.discountAmount) }}</small
              >
            </div>
            <button
              type="button"
              v-if="step > 1"
              class="btn-vintage btn-step-back font-slab"
              :disabled="busy"
              @click="goBack"
            >
              VOLTAR
            </button>
            <button
              type="submit"
              class="btn-vintage btn-step-next next-button font-slab"
              :class="{ 'btn-submit-registration': step === 5 }"
              :disabled="busy || (step === 5 && couponNeedsApply)"
            >
              {{
                busy
                  ? "ABRINDO PAGAMENTO..."
                  : step === 5
                  ? "CONFIRMAR E PAGAR"
                  : returnToSummary
                  ? "VOLTAR AO RESUMO →"
                  : step === 4
                  ? "REVISAR INSCRIÇÃO →"
                  : "CONTINUAR →"
              }}
            </button>
          </div>
        </form>
        <div class="auth-footer-help font-condensed">
          <a
            class="link-btn wa-help"
            href="https://wa.me/5535997500430?text=Preciso%20de%20ajuda%20com%20minha%20inscri%C3%A7%C3%A3o%20na%20Beer%20Run."
            target="_blank"
            rel="noopener noreferrer"
            ><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Falar com
            a Organização</a
          >
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import PaymentStatusPage from "./PaymentStatusPage.vue";
import PublicRegistrationStatus from "./PublicRegistrationStatus.vue";
import CouponEntry from "./CouponEntry.vue";
import ShirtSizeGuide from "./ShirtSizeGuide.vue";
import AthleteKitPreview from "./AthleteKitPreview.vue";
import BirthDateInput from "./BirthDateInput.vue";
import {
  SHIRT_MODELS,
  shirtMeasurements,
  formatShirtSelection,
} from "../services/shirts.js";
import { registrationPrice, money } from "../services/registration-offer.js";
import { resolveRegistrationAthlete } from "../services/registration-access.js";
import { submitRegistration, openCheckout } from "../services/checkout.js";
import {
  trackPageView,
  trackRegistrationEvent,
  trackRegistrationOrder,
} from "../services/analytics.js";
import { analyticsErrorKind } from "../services/analytics-policy.js";
defineEmits(["go-home"]);

const draftKey = "beer_run_registration_draft_v2";
const kitExtras = [
  "Café da manhã antes da prova",
  "Bebidas e alimentação nos pontos de apoio",
  "Atrações durante e após a prova",
];
const steps = [
  { id: "kit-title", label: "Kit e valores" },
  { id: "details-title", label: "Dados pessoais" },
  { id: "contact-title", label: "Contato e emergência" },
  { id: "rules-title", label: "Regulamento" },
  { id: "review-title", label: "Resumo e pagamento" },
];
const step = ref(1),
  busy = ref(false),
  errors = ref({}),
  submitError = ref(""),
  conflict = ref(false);
const furthestStep = ref(1),
  returnToSummary = ref(false);
const lookupOpen = ref(false),
  lookupPhone = ref(""),
  lookupBusy = ref(false),
  lookupMessage = ref("");
const consultationOnly = ref(false),
  lookupNotFound = ref(false);
const hideLookupPanel = ref(false);
const paymentOrder = ref(""),
  publicLookup = ref(null),
  checkoutNotice = ref(""),
  draftRestored = ref(false);
const couponEligible = ref(false),
  couponQuote = ref(null),
  existingRegistration = ref(null);
const form = reactive({
  name: "",
  nickname: "",
  cpf: "",
  birthDate: "",
  gender: "",
  cityState: "",
  phone: "",
  email: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  medicalNotes: "",
  modality: "corrida",
  drinksBeer: false,
  skewerChoice: "1 Carne + 1 Frango",
  shirtModel: "",
  shirtSize: "",
  acceptedTerms: false,
  couponCode: "",
});
const skewerChoices = [
  "1 Carne + 1 Frango",
  "2 Carne",
  "2 Frango",
  "Vegetariano",
];
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const isMinor = computed(
  () =>
    /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) &&
    Number(today.slice(0, 4)) -
      Number(form.birthDate.slice(0, 4)) -
      (today.slice(5) < form.birthDate.slice(5) ? 1 : 0) <
      18
);
const sizes = computed(
  () =>
    SHIRT_MODELS.find((model) => model.value === form.shirtModel)?.sizes || []
);
const measurements = computed(() =>
  shirtMeasurements(form.shirtModel, form.shirtSize)
);
const total = computed(
  () => couponQuote.value?.amount ?? registrationPrice(form.drinksBeer)
);
const couponNeedsApply = computed(
  () => couponEligible.value && !!form.couponCode && !couponQuote.value
);
let draftTimer,
  lookupRevision = 0,
  disposed = false,
  started = false,
  completed = false;

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  return digits.length > 6
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : digits.length > 2
    ? `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    : digits;
}
function formatField(key) {
  if (key === "phone" || key === "emergencyContactPhone")
    form[key] = formatPhone(form[key]);
  if (key === "cpf")
    form.cpf = form.cpf
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\.\d{3})(\d)/, "$1-$2");
  delete errors.value[key];
}
function saveDraft() {
  if (completed || (!started && !draftRestored.value)) return;
  try {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        version: 3,
        step: step.value,
        form: { ...form, acceptedTerms: false },
      })
    );
  } catch {
    /* O formulario continua sem armazenamento. */
  }
}
function restoreDraft(draft) {
  if (!draft?.form || typeof draft.form !== "object") return;
  for (const key of Object.keys(form)) {
    if (key !== "acceptedTerms" && typeof draft.form[key] === typeof form[key])
      form[key] = draft.form[key];
  }
  form.acceptedTerms = false;
  if (!["corrida", "caminhada"].includes(form.modality))
    form.modality = "corrida";
  if (!skewerChoices.includes(form.skewerChoice))
    form.skewerChoice = skewerChoices[0];
  if (!SHIRT_MODELS.some((model) => model.value === form.shirtModel))
    form.shirtModel = "";
  if (!measurements.value) form.shirtSize = "";
  let restoredStep =
    draft.version === 3 && Number.isInteger(draft.step)
      ? Math.min(4, Math.max(1, draft.step))
      : draft.version === 2 && draft.step === 2
      ? 2
      : 1;
  for (let stage = 1; stage < restoredStep; stage++) {
    if (Object.keys(stepIssues(stage)).length) {
      restoredStep = stage;
      break;
    }
  }
  step.value = restoredStep;
  furthestStep.value = restoredStep;
  draftRestored.value = true;
}
watch(
  form,
  () => {
    if (!started) {
      started = true;
      trackRegistrationEvent("inscricao_inicio", {
        etapa: step.value,
        retomada: draftRestored.value ? "sim" : "nao",
      });
    }
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 300);
  },
  { deep: true }
);
watch(
  () => form.shirtModel,
  () => {
    if (!measurements.value) form.shirtSize = "";
  }
);
watch(isMinor, (minor) => {
  if (minor) form.drinksBeer = false;
});
watch(
  () => [form.phone, form.drinksBeer, form.couponCode],
  () => {
    couponQuote.value = null;
  },
  { flush: "sync" }
);
watch(
  () => form.phone,
  () => {
    lookupRevision++;
    couponEligible.value = false;
    existingRegistration.value = null;
    form.couponCode = "";
  },
  { flush: "sync" }
);
watch(step, (value) => {
  trackRegistrationEvent("inscricao_etapa_visualizada", { etapa: value });
  saveDraft();
});

function validCpf(value) {
  const cpf = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  return [9, 10].every((size) => {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i);
    const digit = (sum * 10) % 11;
    return (digit === 10 ? 0 : digit) === Number(cpf[size]);
  });
}
function stepIssues(stage) {
  const issues = {};
  if (stage === 1) {
    if (!form.shirtModel) issues.shirtModel = "Escolha o modelo da camiseta.";
    if (!measurements.value)
      issues.shirtSize = "Escolha um tamanho disponível para o modelo.";
  } else if (stage === 2) {
    if (form.name.trim().length < 3) issues.name = "Informe seu nome completo.";
    if (!validCpf(form.cpf)) issues.cpf = "Confira os números do seu CPF.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) || form.birthDate > today)
      issues.birthDate = "Informe uma data de nascimento válida.";
    if (!form.cityState.trim())
      issues.cityState = "Informe sua cidade e estado.";
    if (!["M", "F", "O"].includes(form.gender))
      issues.gender = "Selecione uma opção.";
  } else if (stage === 3) {
    if (!/^[1-9]\d9\d{8}$/.test(form.phone.replace(/\D/g, "")))
      issues.phone = "Informe um celular válido com DDD.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      issues.email = "Confira seu e-mail.";
    if (form.emergencyContactName.trim().length < 3)
      issues.emergencyContactName = "Informe o nome de um contato.";
    if (!/^[1-9]\d\d{8,9}$/.test(form.emergencyContactPhone.replace(/\D/g, "")))
      issues.emergencyContactPhone = "Informe um telefone com DDD.";
  } else if (stage === 4 && !form.acceptedTerms) {
    issues.acceptedTerms = "Leia e aceite o regulamento para continuar.";
  }
  return issues;
}
async function validate(through = step.value) {
  errors.value = {};
  for (let stage = 1; stage <= through; stage++) {
    const issues = stepIssues(stage);
    if (Object.keys(issues).length) {
      step.value = stage;
      errors.value = issues;
      trackRegistrationEvent("inscricao_erro", {
        etapa: stage,
        tipo_erro: "validacao",
      });
      await nextTick();
      document
        .querySelector('.registration-form [aria-invalid="true"]')
        ?.focus();
      return false;
    }
  }
  return true;
}
async function focusStep() {
  await nextTick();
  const heading = document.getElementById(steps[step.value - 1].id);
  heading?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function goToStep(target) {
  if (busy.value || target < 1 || target > furthestStep.value) return;
  if (target > step.value && !(await validate(target - 1))) return;
  step.value = target;
  errors.value = {};
  submitError.value = "";
  returnToSummary.value = false;
  focusStep();
}
function goBack() {
  goToStep(step.value - 1);
}
function editStep(target) {
  step.value = target;
  errors.value = {};
  returnToSummary.value = true;
  focusStep();
}
function showExisting(found) {
  if (found.orderId) paymentOrder.value = found.orderId;
  else if (found.publicStatus) publicLookup.value = found;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function inspectPhone() {
  const phone = form.phone;
  if (!/^[1-9]\d9\d{8}$/.test(phone.replace(/\D/g, ""))) return;
  const revision = ++lookupRevision;
  try {
    const found = await resolveRegistrationAthlete(phone);
    if (disposed || revision !== lookupRevision) return;
    couponEligible.value = found?.couponEligible === true;
    existingRegistration.value =
      found?.orderId || found?.publicStatus ? found : null;
  } catch {
    /* A consulta auxiliar nao impede uma nova inscricao; o POST revalida os dados. */
  }
}
async function lookupRegistration() {
  if (lookupBusy.value) return;
  lookupMessage.value = "";
  lookupNotFound.value = false;
  if (!/^[1-9]\d9\d{8}$/.test(lookupPhone.value.replace(/\D/g, ""))) {
    lookupMessage.value = "Informe um celular válido com DDD.";
    return;
  }
  lookupBusy.value = true;
  trackRegistrationEvent("inscricao_consulta", {
    origem: "manual",
    resultado: "tentativa",
  });
  try {
    const found = await resolveRegistrationAthlete(lookupPhone.value);
    if (disposed) return;
    trackRegistrationEvent("inscricao_consulta", {
      origem: "manual",
      resultado: found?.orderId
        ? "pedido_existente"
        : found?.publicStatus
        ? "status_disponivel"
        : "nao_encontrado",
    });
    if (found?.orderId || found?.publicStatus) {
      showExisting(found);
      return;
    }
    if (consultationOnly.value) {
      lookupNotFound.value = true;
      lookupMessage.value =
        "Não encontramos um pedido de inscrição para este WhatsApp. Confira o número ou faça sua inscrição.";
      return;
    }
    // Somente rascunhos do proprio navegador; nunca recupera CPF/saude por telefone.
    const previousPhone = form.phone.replace(/\D/g, "");
    if (
      previousPhone &&
      previousPhone !== lookupPhone.value.replace(/\D/g, "")
    ) {
      for (const key of [
        "name",
        "nickname",
        "cpf",
        "birthDate",
        "gender",
        "cityState",
        "email",
        "emergencyContactName",
        "emergencyContactPhone",
        "medicalNotes",
      ])
        form[key] = "";
      form.acceptedTerms = false;
    }
    form.phone = lookupPhone.value;
    try {
      const oldDraft = JSON.parse(
        localStorage.getItem(
          "beer_run_draft_" + lookupPhone.value.replace(/\D/g, "")
        ) || "null"
      );
      if (oldDraft) restoreDraft(oldDraft);
    } catch {
      /* Rascunho indisponivel. */
    }
    if (!form.name.trim() && found?.name) form.name = found.name;
    if (!form.nickname.trim() && found?.nickname)
      form.nickname = found.nickname;
    couponEligible.value = found?.couponEligible === true;
    lookupMessage.value =
      "Você já pode se inscrever. Escolha seu kit e complete os dados abaixo.";
  } catch (error) {
    lookupMessage.value = error.message;
  } finally {
    lookupBusy.value = false;
  }
}
async function submitStep() {
  if (busy.value) return;
  submitError.value = "";
  conflict.value = false;
  if (!(await validate(returnToSummary.value ? 4 : step.value))) return;
  if (step.value < 5) {
    trackRegistrationEvent("inscricao_etapa_concluida", {
      etapa: step.value,
      modalidade: form.modality,
      chopp: form.drinksBeer,
      camiseta: form.shirtSize,
    });
    step.value = returnToSummary.value ? 5 : step.value + 1;
    furthestStep.value = Math.max(furthestStep.value, step.value);
    returnToSummary.value = false;
    focusStep();
    return;
  }
  if (couponNeedsApply.value) return;
  busy.value = true;
  saveDraft();
  trackRegistrationEvent("inscricao_etapa_concluida", { etapa: 5 });
  trackRegistrationEvent("submit_inscricao_oficial", {
    modalidade: form.modality,
    chopp: form.drinksBeer,
  });
  try {
    const result = await submitRegistration({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      cpf: form.cpf,
      birthDate: form.birthDate,
      gender: form.gender,
      phone: form.phone,
      email: form.email.trim(),
      cityState: form.cityState.trim(),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone,
      medicalNotes: form.medicalNotes.trim(),
      modality: form.modality === "corrida" ? "RUN" : "WALK",
      beer: form.drinksBeer,
      skewerChoice: form.skewerChoice,
      shirtModel: form.shirtModel,
      shirtSize: form.shirtSize,
      acceptedTerms: form.acceptedTerms,
      ...(couponEligible.value && form.couponCode
        ? { couponCode: form.couponCode }
        : {}),
    });
    completed = true;
    clearTimeout(draftTimer);
    try {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(
        "beer_run_draft_" + form.phone.replace(/\D/g, "")
      );
    } catch {
      /* Pedido ja salvo. */
    }
    trackRegistrationOrder(result.orderId, {
      modalidade: form.modality,
      chopp: form.drinksBeer,
      camiseta: form.shirtSize,
      value: result.amount / 100,
      desconto: (result.discountAmount || 0) / 100,
      currency: "BRL",
      com_cupom: result.discountAmount > 0 ? "sim" : "nao",
    });
    paymentOrder.value = result.orderId;
    if (result.status === "PENDING_PAYMENT" && result.checkoutUrl) {
      try {
        openCheckout(result.checkoutUrl);
      } catch {
        checkoutNotice.value =
          "Seu pedido foi salvo. Não foi possível abrir o pagamento. Continue pelo botão abaixo ou fale com a organização.";
      }
    } else if (result.status === "PENDING_PAYMENT")
      checkoutNotice.value =
        "Seu pedido foi salvo. Estamos preparando o pagamento; consulte o status abaixo para continuar.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    conflict.value = error.code === "REGISTRATION_CONFLICT";
    submitError.value =
      error.message ||
      "Não foi possível concluir. Seus dados continuam aqui; tente novamente.";
    trackRegistrationEvent("inscricao_erro", {
      etapa: 5,
      tipo_erro: analyticsErrorKind(error),
    });
  } finally {
    busy.value = false;
  }
}
function saveOnExit() {
  clearTimeout(draftTimer);
  saveDraft();
}
function handleHash() {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const wasConsultationOnly = consultationOnly.value;
  consultationOnly.value = params.get("consulta") === "1";
  if (consultationOnly.value) {
    hideLookupPanel.value = false;
    lookupOpen.value = true;
    window.scrollTo({ top: 0 });
  } else if (wasConsultationOnly) {
    hideLookupPanel.value = true;
    lookupOpen.value = false;
    lookupMessage.value = "";
    lookupNotFound.value = false;
    focusStep();
  }
  const phone = params.get("tel") || params.get("phone");
  if (phone) {
    hideLookupPanel.value = false;
    lookupPhone.value = formatPhone(phone);
    lookupOpen.value = true;
    lookupRegistration();
  }
}
onMounted(() => {
  trackPageView();
  trackRegistrationEvent("inscricao_visualizada");
  try {
    restoreDraft(JSON.parse(localStorage.getItem(draftKey) || "null"));
  } catch {
    /* Rascunho indisponivel. */
  }
  handleHash();
  if (!consultationOnly.value) inspectPhone();
  trackRegistrationEvent("inscricao_etapa_visualizada", { etapa: step.value });
  window.addEventListener("pagehide", saveOnExit);
  window.addEventListener("hashchange", handleHash);
});
onUnmounted(() => {
  disposed = true;
  lookupRevision++;
  saveOnExit();
  window.removeEventListener("pagehide", saveOnExit);
  window.removeEventListener("hashchange", handleHash);
});

const skewerCarne = ref(1);
const skewerFrango = ref(1);
const skewerIsVegetarian = ref(false);

function formatSkewerLabel(val) {
  if (val === "1 Carne + 1 Frango") return "1 Carne + 1 Frango (1 de cada)";
  if (val === "2 Carne") return "2 Espetinhos de Carne";
  if (val === "2 Frango") return "2 Espetinhos de Frango";
  if (val === "Vegetariano") return "Vegetariano / Sem Carne";
  return val || "1 Carne + 1 Frango (1 de cada)";
}

function updateSkewerChoice() {
  if (skewerIsVegetarian.value) {
    form.skewerChoice = "Vegetariano";
  } else if (skewerCarne.value === 1 && skewerFrango.value === 1) {
    form.skewerChoice = "1 Carne + 1 Frango";
  } else if (skewerCarne.value === 2) {
    form.skewerChoice = "2 Carne";
  } else if (skewerFrango.value === 2) {
    form.skewerChoice = "2 Frango";
  } else {
    form.skewerChoice = "1 Carne + 1 Frango";
  }
  saveDraft();
}

function incrementCarne() {
  if (skewerIsVegetarian.value) skewerIsVegetarian.value = false;
  if (skewerCarne.value < 2) {
    skewerCarne.value++;
    skewerFrango.value = 2 - skewerCarne.value;
  }
  updateSkewerChoice();
}

function decrementCarne() {
  if (skewerCarne.value > 0) {
    skewerCarne.value--;
    skewerFrango.value = 2 - skewerCarne.value;
  }
  updateSkewerChoice();
}

function incrementFrango() {
  if (skewerIsVegetarian.value) skewerIsVegetarian.value = false;
  if (skewerFrango.value < 2) {
    skewerFrango.value++;
    skewerCarne.value = 2 - skewerFrango.value;
  }
  updateSkewerChoice();
}

function decrementFrango() {
  if (skewerFrango.value > 0) {
    skewerFrango.value--;
    skewerCarne.value = 2 - skewerFrango.value;
  }
  updateSkewerChoice();
}

function toggleVegetarian() {
  skewerIsVegetarian.value = !skewerIsVegetarian.value;
  if (skewerIsVegetarian.value) {
    skewerCarne.value = 0;
    skewerFrango.value = 0;
  } else {
    skewerCarne.value = 1;
    skewerFrango.value = 1;
  }
  updateSkewerChoice();
}

function syncSkewersFromChoice(choice) {
  if (choice === "Vegetariano") {
    skewerIsVegetarian.value = true;
    skewerCarne.value = 0;
    skewerFrango.value = 0;
  } else if (choice === "2 Carne") {
    skewerIsVegetarian.value = false;
    skewerCarne.value = 2;
    skewerFrango.value = 0;
  } else if (choice === "2 Frango") {
    skewerIsVegetarian.value = false;
    skewerCarne.value = 0;
    skewerFrango.value = 2;
  } else {
    skewerIsVegetarian.value = false;
    skewerCarne.value = 1;
    skewerFrango.value = 1;
  }
}

watch(() => form.skewerChoice, syncSkewersFromChoice, { immediate: true });
const athleteAge = computed(() =>
  form.birthDate
    ? Number(today.slice(0, 4)) -
      Number(form.birthDate.slice(0, 4)) -
      (today.slice(5) < form.birthDate.slice(5) ? 1 : 0)
    : null
);
</script>

<style scoped>
.registration-kit-summary {
  background: #faf7f0;
  border: 1px solid #e2d9cc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 18px;
}
.review-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.review-section-heading h3 {
  font-size: 0.95rem;
  margin: 0;
}
.review-edit-button {
  background: none;
  border: none;
  color: #91500c;
  text-decoration: underline;
  font: inherit;
  cursor: pointer;
  padding: 4px 0;
}
.review-kit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}
.review-kit-grid dt {
  color: #756c60;
  font-size: 0.82rem;
  margin-bottom: 3px;
}
.review-kit-grid dd {
  margin: 0;
  color: #29241d;
  font-weight: 700;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}
.registration-total-card {
  background: #27231d;
  color: #fff9ee;
  border-radius: 8px;
  padding: 20px;
}
.review-amounts {
  margin: 0;
}
.review-amounts > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}
.review-amounts dd {
  margin: 0;
  white-space: nowrap;
}
.review-discount {
  margin-top: 10px;
  color: #b5e4aa;
}
.review-amounts .review-total {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #75654e;
}
.review-total dt {
  font-weight: 700;
}
.review-total dd {
  color: #ffbe59;
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 800;
}
.registration-total-card > p {
  font-size: 0.8rem;
  color: #ded1bd;
  margin: 12px 0 0;
}
.review-payment-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #655d52;
  margin-top: 16px;
  font-size: 0.9rem;
  line-height: 1.45;
}
.review-payment-note i {
  margin-top: 4px;
}
.review-payment-note p {
  margin: 0;
}
.review-coupon-hint {
  color: #87500e;
  margin-top: 12px;
  font-size: 0.88rem;
}
.btn-step-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 480px) {
  .registration-kit-summary,
  .registration-total-card {
    padding: 14px;
  }
  .review-kit-grid {
    gap: 12px;
  }
  .payment-review-card .final-actions {
    flex-wrap: wrap;
  }
  .payment-review-card .btn-submit-registration {
    min-width: 180px;
  }
}
.official-reg-page {
  min-height: 100vh;
  background-color: var(--bg-parchment);
  background-image: linear-gradient(rgb(247 241 228 / 60%), rgb(247 241 228)),
    url(/bg02.jpg);
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
  margin-bottom: 10px;
}

.input-with-button {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-input {
  width: 100%;
  min-width: 0;
  min-height: 52px;
  box-sizing: border-box;
  font-size: 1.05rem !important;
  font-weight: 700;
  padding: 9px 12px !important;
  letter-spacing: 0.5px;
}

.btn-auth {
  width: 100%;
  min-height: 52px;
  justify-content: center;
  white-space: nowrap;
  font-size: 0.92rem;
  padding: 9px 16px;
  border-radius: 6px;
}

.auth-form .form-group {
  margin-bottom: 0;
}
.auth-phone-help {
  margin: 14px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}
.auth-input:focus-visible {
  outline: 2px solid var(--accent-gold);
  outline-offset: 3px;
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

/* Grid de Prévia das 5 Etapas */
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
  background: linear-gradient(
    135deg,
    var(--accent-gold) 0%,
    var(--accent-amber) 100%
  );
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
  content: "";
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
  width: 100%;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 4px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.choice-card {
  min-width: 0;
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
  background: linear-gradient(
    135deg,
    var(--accent-gold) 0%,
    var(--accent-amber) 100%
  );
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
  background: linear-gradient(
    135deg,
    var(--accent-gold) 0%,
    var(--accent-amber) 100%
  );
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
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
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
    gap: 14px;
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

  /* Stepper Minimalista no Mobile: linha sutil com 5 pequenos círculos */
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
    grid-template-columns: minmax(0, 1fr);
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

/* Inscricao aberta: usa os mesmos cards, cores, fontes e controles da marca. */
.reg-container {
  max-width: 800px;
  margin: 0 auto;
}
.registration-form {
  width: 100%;
  min-width: 0;
}
.reg-container > .lookup-panel {
  text-align: center;
}
.reg-container > .lookup-panel[open] {
  text-align: left;
}
.reg-container .wizard-stepper {
  max-width: 620px;
  margin: 24px auto 62px;
  width: calc(100% - 72px);
}
.step-name {
  position: absolute;
  top: 36px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.2;
  color: var(--text-muted);
  font-weight: 700;
}
.step-tab.active .step-name {
  color: var(--accent-dark);
}
.registration-form .vintage-input {
  min-height: 44px;
  font-size: 1rem;
}
.registration-form .form-grid {
  gap: 16px;
}
.registration-form .form-section-card {
  margin-bottom: 16px;
}
.kit-grid > .form-group:nth-child(1),
.kit-grid > .form-group:nth-child(2),
.kit-grid > .form-group:nth-child(4),
.kit-grid > .form-group:nth-child(5) {
  grid-column: auto;
}
.kit-grid > .form-group:nth-child(-n + 2) {
  justify-content: space-between;
}
.registration-bottom-bar .btn-step-back {
  flex: 0 0 auto;
}
@media (min-width: 769px) {
  .registration-form .form-section-card {
    padding: 24px 28px;
  }
  .registration-form .form-label {
    font-size: 0.9rem;
  }
  .registration-form .step-subtitle {
    font-size: 0.9rem;
  }
  .registration-form .choice-card {
    min-height: 60px;
  }
  .registration-form .section-title {
    font-size: 1.15rem;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.choice-card:focus-within {
  outline: 2px solid var(--accent-gold);
  outline-offset: 3px;
}
.choice-card:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
.choice-text span {
  white-space: normal;
  overflow-wrap: anywhere;
}
.registration-fields {
  padding: 0;
  margin: 0;
  border: 0;
  min-width: 0;
}
.lookup-panel {
  margin: 0 0 18px;
}
.lookup-panel > summary {
  cursor: pointer;
  margin: 0;
}
.lookup-panel[open] > summary {
  margin-bottom: 16px;
}
.lookup-panel .lookup-form {
  margin-top: 14px;
}
.consultation-page .lookup-panel {
  padding: 0;
  margin: 0;
}
.registration-offer {
  margin: 0 0 24px;
  padding: 4px 0 20px;
  border-bottom: 1px dashed #dfd5c4;
}
.offer-benefits {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-muted);
  margin: 0 0 18px;
}
.offer-benefits strong {
  color: var(--text-dark);
}
.offer-extras {
  margin: -6px 0 20px;
  padding-left: 20px;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}
.offer-extras li + li {
  margin-top: 4px;
}
.offer-extras li::marker {
  color: #87500e;
}
.review-extras-title {
  margin: 18px 0 8px;
  font-weight: 700;
}
.review-extras {
  margin: 0;
}
.offer-prices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}
.offer-prices > div {
  padding: 0 16px;
  text-align: center;
}
.offer-prices > div + div {
  border-left: 1px solid #dfd5c4;
}
.offer-prices dt {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.offer-prices dd {
  margin: 0;
  font-size: clamp(1.25rem, 5vw, 1.65rem);
  line-height: 1.3;
  font-weight: 800;
  white-space: nowrap;
  color: #87500e;
}
.regulation-details {
  margin-top: 20px;
}
.regulation-details > summary {
  cursor: pointer;
  padding: 12px 0;
}
.regulation-details .rules-summary-grid {
  margin-top: 12px;
}
.registration-fields .step-card {
  margin-bottom: 20px;
}
.registration-fields input,
.registration-fields select {
  scroll-margin-block: 90px 150px;
}
.registration-fields h2 {
  scroll-margin-top: 85px;
}
.registration-fields [aria-invalid="true"] {
  outline: 2px solid #b64b37;
  outline-offset: 2px;
}
.registration-bottom-bar {
  position: fixed;
  bottom: 12px;
  left: 0;
  right: 0;
  width: calc(100% - 32px);
  max-width: 800px;
  margin: 0 auto;
  z-index: 30;
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #f4e8d0;
  border: 2px solid var(--accent-border);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--accent-border);
  gap: 12px;
}
.running-total {
  display: flex;
  flex-direction: column;
  margin-right: auto;
}
.running-total > span {
  font-size: 0.72rem;
  font-weight: 800;
}
.running-total strong {
  font-size: 1.45rem;
  line-height: 1.25;
  color: #87500e;
}
.running-total small {
  font-size: 0.8rem;
}
.registration-bottom-bar .next-button {
  min-height: 48px;
}
.official-reg-page {
  padding-bottom: calc(155px + env(safe-area-inset-bottom));
}
@media (min-width: 601px) and (max-width: 768px) {
  .registration-bottom-bar {
    width: calc(100% - 20px);
  }
}
@media (max-width: 600px) {
  .reg-container .wizard-stepper {
    width: calc(100% - 44px);
    margin-bottom: 62px;
  }
  .step-name {
    width: 60px;
    font-size: 0.67rem;
  }
  .vintage-input {
    min-height: 44px;
    font-size: 16px;
  }
  .toggle-pill,
  .btn-stepper {
    min-height: 44px;
  }
  .official-reg-page {
    padding-bottom: calc(155px + env(safe-area-inset-bottom));
  }
  .registration-bottom-bar {
    bottom: 0;
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    margin: 0;
    border-radius: 0;
    border-width: 2px 0 0;
    padding: 10px 14px max(12px, env(safe-area-inset-bottom));
    gap: 8px 12px;
  }
  .registration-bottom-bar .btn-step-back {
    display: inline-flex;
    min-height: 48px;
    grid-column: 1;
  }
  .registration-bottom-bar .next-button {
    min-width: 0;
    width: 100%;
    padding: 12px;
    font-size: 0.82rem;
    grid-column: 2;
  }
  .registration-bottom-bar.is-first-step .next-button {
    grid-column: 1 / -1;
  }
  .running-total {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
    margin: 0;
    flex-wrap: wrap;
  }
  .running-total strong {
    margin-left: auto;
  }
  .running-total strong {
    font-size: 1.3rem;
  }
  .lookup-panel {
    padding: 12px;
  }
}
</style>
