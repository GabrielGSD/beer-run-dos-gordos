<template>
  <section id="manifesto" class="manifesto-section dash-section">
    <div class="container">
      <h2 class="section-title">MANIFESTO</h2>
      <div class="manifesto-map-wrapper">
        <!-- Antique Map Parchment Card -->
        <article class="map-parchment-card">
          <!-- Clean Background Parchment Texture -->
          <div class="map-bg-texture" aria-hidden="true"></div>

          <!-- Top-Right Vintage Tradition Stamp -->
          <div class="vintage-seal-stamp font-condensed" aria-hidden="true">
            <span class="seal-stars">★★★</span>
            <span class="seal-title">TRADIÇÃO</span>
            <span class="seal-year">OFICIAL</span>
          </div>

          <div class="manifesto-inner-content">
            <!-- Header Title -->
            <header class="manifesto-header">
              <h3 class="manifesto-title font-lora">
                Correr é só uma parte da história.
              </h3>
              <div class="manifesto-divider"></div>
            </header>

            <!-- Letter Body in Lora Serif -->
            <div class="manifesto-body font-lora">
              <p>
                O que importa mesmo é reunir os amigos, juntar a família, dar boas risadas e criar histórias que vão muito além da linha de chegada.
              </p>

              <p>
                Por isso nasceu a <strong>Beer Run dos Gordos</strong>.
              </p>

              <p>
                Uma corrida feita para quem corre, para quem tenta correr e, principalmente, para quem veio viver o momento.
              </p>

              <p>Mas a história não termina quando a prova acaba.</p>

              <p>
                Toda essa diversão também tem um propósito: arrecadar para o <strong>Natal Solidário dos Gordos</strong>, uma tradição que adoça o fim do ano das crianças.
              </p>

              <p>
                Porque no final, o que importa não é o tempo que você fez, mas o sorriso que você ajuda a colocar no rosto de uma criança.
              </p>

              <p class="manifesto-closing font-lora">
                Então venha correr, caminhar, rir, beber e, principalmente, fazer parte dessa história.
              </p>
            </div>

            <!-- Footer Slogan & Santa Sticker -->
            <footer class="manifesto-footer">
              <div class="slogan-box">
                <p class="slogan-sub font-lora">
                  Vamos juntos fazer um Natal mais doce para as crianças!
                </p>
              </div>

              <img
                src="/images/santa-icon.webp"
                alt="Natal Solidário dos Gordos"
                class="manifesto-santa-icon"
                loading="lazy"
              />
            </footer>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-registration'])
</script>

<style scoped>
.manifesto-section {
  padding: 40px 0 70px 0;
  position: relative;
}

.manifesto-map-wrapper {
  max-width: 860px;
  margin: 0 auto;
  position: relative;
  border: 2px solid rgba(25, 23, 20, 0.85);
  border-radius: 6px;
  box-shadow: 4px 4px 0px rgba(25, 23, 20, 0.85);
}

/* Map Parchment Card */
.map-parchment-card {
  position: relative;
  background-color: #f3e6ce;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(115, 75, 25, 0.15);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.map-parchment-card:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 0 50px rgba(115, 75, 25, 0.2);
}

/* Background Parchment Texture */
.map-bg-texture {
  position: absolute;
  inset: 0;
  background-image: url('/images/parchment-clean.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.4;
  pointer-events: none;
  z-index: 1;
}

/* Vintage Tradition Stamp */
.vintage-seal-stamp {
  position: absolute;
  top: 24px;
  right: 26px;
  width: 76px;
  height: 76px;
  border: 2px dashed #5d4d19cc;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #5d4d19cc;
  transform: rotate(12deg);
  opacity: 0.88;
  pointer-events: none;
  z-index: 4;
}

.seal-stars {
  font-size: 0.65rem;
  letter-spacing: 2px;
  line-height: 1;
}

.seal-title {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.seal-year {
  font-size: 0.65rem;
  font-weight: 800;
}

/* Inner Content Area */
.manifesto-inner-content {
  position: relative;
  z-index: 3;
  padding: 44px 50px 38px 50px;
}

/* Header */
.manifesto-header {
  margin-bottom: 22px;
  text-align: left;
}

.manifesto-title {
  font-family: var(--font-lora), 'Lora', serif;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 700;
  font-style: italic;
  color: #231b14;
  letter-spacing: -0.3px;
  line-height: 1.22;
  text-transform: none;
  margin-bottom: 12px;
  text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.45);
}

.manifesto-divider {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #5d4d19cc 0%, #8c7353 60%, rgba(60, 50, 38, 0.1) 100%);
  border-radius: 2px;
}

/* Body Text - Lora Serif Lettering */
.manifesto-body {
  font-family: var(--font-lora), 'Lora', serif;
  font-size: 1.25rem;
  font-weight: 500;
  font-style: normal;
  color: #2b221a;
  line-height: 1.68;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
  letter-spacing: 0.15px;
}

.manifesto-body strong {
  color: #17110a;
  font-weight: 700;
  font-style: normal;
  border-bottom: 1.5px solid #5d4d196b;
}

.manifesto-closing {
  font-family: var(--font-lora), 'Lora', serif;
  font-size: 1.28rem;
  font-weight: 600;
  font-style: italic;
  color: #1e1711;
  margin-top: 4px;
}

/* Footer & Santa Sticker */
.manifesto-footer {
  margin-top: 26px;
  border-top: 2px dashed rgba(60, 50, 38, 0.35);
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slogan-box {
  text-align: center;
  margin-bottom: 14px;
}

.slogan-sub {
  font-family: var(--font-lora), 'Lora', serif;
  font-size: clamp(1.12rem, 2.3vw, 1.4rem);
  font-weight: bolder;
  font-style: italic;
  color: #8b3224;
  line-height: 1.3;
}

.manifesto-santa-icon {
  width: 96px;
  height: auto;
  transform: rotate(3deg);
  filter: drop-shadow(2px 4px 10px rgba(35, 25, 15, 0.22));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.manifesto-santa-icon:hover {
  transform: scale(1.1) translateY(-3px) rotate(0deg);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .manifesto-inner-content {
    padding: 30px 18px 24px 18px;
  }

  .vintage-seal-stamp {
    width: 58px;
    height: 58px;
    top: 14px;
    right: 14px;
  }

  .seal-text {
    font-size: 0.58rem;
  }

  .manifesto-title {
    font-size: 1.45rem;
    padding-right: 56px;
  }

  .manifesto-body {
    font-size: 1.12rem;
    line-height: 1.55;
    gap: 14px;
  }

  .manifesto-closing {
    font-size: 1.15rem;
  }

  .slogan-sub {
    font-size: 1.05rem;
  }

  .manifesto-santa-icon {
    width: 78px;
  }
}
</style>
