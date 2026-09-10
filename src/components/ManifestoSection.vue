<template>
  <section id="manifesto" class="manifesto-section dash-section">
    <div class="container">
      <h2 class="section-title">MANIFESTO</h2>

      <div class="vintage-card manifesto-card">
        <!-- Festive Vintage Corner Stamp -->
        <div class="solidary-stamp font-condensed">
          <div class="stamp-inner">
            <span class="stamp-icon">🎅</span>
            <span class="stamp-title">NATAL SOLIDÁRIO</span>
            <span class="stamp-subtitle">TRADIÇÃO</span>
          </div>
        </div>

        <div class="manifesto-header">
          <h3 class="manifesto-headline font-slab">
            "A gente acredita que correr é só uma parte da história."
          </h3>
        </div>

        <div class="manifesto-body font-condensed">
          <p class="manifesto-lead">
            O que importa mesmo é reunir os amigos, juntar a família, dar boas risadas e criar histórias que vão muito além da linha de chegada.
          </p>

          <p class="manifesto-paragraph">
            Por isso nasceu a <strong>Beer Run dos Gordos</strong>: uma corrida feita para quem corre, para quem tenta correr e, principalmente, para quem veio viver o momento.
          </p>

          <!-- Festive Christmas Solidary Showcase Box -->
          <div class="christmas-solidary-box">
            <!-- Festive Ribbon Bar -->
            <div class="christmas-ribbon-stripe"></div>

            <div class="christmas-box-inner">
              <div class="christmas-header">
                <span class="christmas-tag font-slab">
                  🎄 TRADIÇÃO OFICIAL DE FIM DE ANO 🎅
                </span>
                <h4 class="christmas-title font-slab">
                  NATAL SOLIDÁRIO DOS GORDOS
                </h4>
                <p class="christmas-subtitle font-condensed">
                  Toda a nossa diversão tem um coração gigante por trás!
                </p>
              </div>

              <div class="christmas-story font-condensed">
                <p>
                  Mas a história não termina quando a prova acaba! Toda essa festa tem um propósito muito especial:
                  arrecadar para o Natal Solidário dos Gordos, uma tradição emocionante que leva doces, balas, chocolates e muitos sorrisos para centenas de crianças no Natal.
                </p>
              </div>

              <!-- Festive Highlights Grid -->
              <div class="christmas-pillars-grid">
                <div class="pillar-card">
                  <span class="pillar-icon">🍬</span>
                  <h5 class="pillar-title font-slab">DOCES & BALAS</h5>
                  <p class="pillar-desc font-condensed">Sacos cheios de guloseimas e alegria entregues diretamente para as crianças.</p>
                </div>

                <div class="pillar-card">
                  <span class="pillar-icon">🎅</span>
                  <h5 class="pillar-title font-slab">CORRENTE DO BEM</h5>
                  <p class="pillar-desc font-condensed">Uma tradição da nossa galera para transformar o Natal da comunidade.</p>
                </div>

                <div class="pillar-card">
                  <span class="pillar-icon">🎁</span>
                  <h5 class="pillar-title font-slab">VOCÊ FAZ A FESTA</h5>
                  <p class="pillar-desc font-condensed">Ao se inscrever, você também vira o Papai Noel dessa turma!</p>
                </div>
              </div>
            </div>
          </div>

          <p class="manifesto-invitation font-slab">
            Então venha correr, caminhar, rir, beber e, principalmente, fazer parte dessa história.
          </p>
        </div>

        <!-- Punchline & Slogan Footer Banner -->
        <div class="manifesto-footer-banner">
          <div class="slogan-box">
            <span class="slogan-primary font-slab">PERFORMANCE QUESTIONÁVEL. HISTÓRIAS GARANTIDAS.</span>
            <span class="slogan-secondary font-condensed">E um Natal muito mais doce para as crianças! 🎅🍬✨</span>
          </div>

          <button
            @click="$emit('open-registration')"
            class="btn-vintage btn-manifesto font-slab"
          >
            FAZER PARTE DESSA HISTÓRIA <i class="fa-solid fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-registration'])
</script>

<style scoped>
.manifesto-section {
  padding: 50px 0 60px 0;
  position: relative;
}

.manifesto-card {
  position: relative;
  padding: 44px 40px 36px 40px;
  border-radius: 8px;
  background: rgba(247, 241, 228, 0.96);
  border: 2px solid var(--accent-border);
  box-shadow: 6px 6px 0px rgba(25, 23, 20, 0.85);
  overflow: hidden;
}

/* Festive Corner Stamp */
.solidary-stamp {
  position: absolute;
  top: 24px;
  right: 28px;
  width: 96px;
  height: 96px;
  border: 2.5px dashed #a82424;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(12deg);
  background: rgba(168, 36, 36, 0.08);
  box-shadow: 0 0 12px rgba(168, 36, 36, 0.15);
  pointer-events: none;
}

.stamp-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  line-height: 1.1;
}

.stamp-icon {
  font-size: 1.4rem;
  margin-bottom: 2px;
}

.stamp-title {
  font-size: 0.7rem;
  font-weight: 900;
  color: #a82424;
  letter-spacing: 0.5px;
}

.stamp-subtitle {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--accent-dark);
}

/* Header */
.manifesto-header {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 28px auto;
}

.manifesto-headline {
  font-size: 1.9rem;
  font-weight: 900;
  color: var(--accent-dark);
  line-height: 1.3;
  letter-spacing: -0.5px;
}

/* Body */
.manifesto-body {
  max-width: 860px;
  margin: 0 auto;
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--text-dark);
}

.manifesto-lead {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-dark);
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.5;
}

.manifesto-paragraph {
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
  color: var(--accent-dark);
  margin-bottom: 28px;
}

.manifesto-paragraph strong {
  color: var(--accent-dark);
}

/* =========================================
   Festive Christmas Solidary Box Redesign
   ========================================= */
.christmas-solidary-box {
  position: relative;
  background: linear-gradient(145deg, #fff 0%, #fff9ed 50%, #fff 100%);
  border-left: 3px solid rgba(39, 71, 40, 0.9);
  border-radius: 10px;
  box-shadow: 4px 5px 0px rgba(39, 71, 40, 0.9), 0 8px 24px rgba(184, 50, 39, 0.12);
  margin: 32px 0;
  overflow: hidden;
}

/* Candy-cane festive striped top bar */
.christmas-ribbon-stripe {
  height: 8px;
  width: 100%;
  background: repeating-linear-gradient(
    45deg,
    #b83227,
    #b83227 12px,
    #ffffff 12px,
    #ffffff 22px,
    #274728 22px,
    #274728 34px,
    #ffffff 34px,
    #ffffff 44px
  );
}

.christmas-box-inner {
  padding: 28px 28px 26px 28px;
}

.christmas-header {
  text-align: center;
  margin-bottom: 20px;
}

.christmas-tag {
  display: inline-block;
  background: #274728;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid #d9822b;
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
}

.christmas-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #b83227;
  letter-spacing: -0.3px;
  margin-bottom: 6px;
  text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.08);
}

.christmas-subtitle {
  font-size: 1.1rem;
  font-weight: 700;
  color: #274728;
}

.christmas-story {
  text-align: center;
  font-size: 1.15rem;
  font-weight: 600;
  color: #2c271f;
  line-height: 1.55;
  max-width: 760px;
  margin: 0 auto 24px auto;
}

.christmas-story strong {
  color: #b83227;
  font-weight: 800;
}

/* Highlights 3 Pillars */
.christmas-pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.pillar-card {
  background: #ffffff;
  border: 2px solid rgba(184, 50, 39, 0.35);
  border-top: 3px solid #b83227;
  border-radius: 8px;
  padding: 16px 14px;
  text-align: center;
  box-shadow: 2px 3px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.pillar-card:hover {
  transform: translateY(-3px);
  border-color: #b83227;
  box-shadow: 0 6px 14px rgba(184, 50, 39, 0.15);
}

.pillar-icon {
  display: inline-block;
  font-size: 2rem;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.pillar-title {
  font-size: 1rem;
  font-weight: 900;
  color: #b83227;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.pillar-desc {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.35;
}

.manifesto-invitation {
  font-size: 1.25rem;
  font-weight: 800;
  text-align: center;
  color: var(--accent-dark);
  margin: 28px 0 32px 0;
  line-height: 1.4;
}

/* Footer Banner */
.manifesto-footer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  background-color: var(--accent-dark);
  color: var(--text-light);
  padding: 18px 24px;
  border-radius: 6px;
  border: 1px solid rgba(217, 130, 43, 0.35);
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.25);
  margin-top: 10px;
}

.slogan-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slogan-primary {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--accent-gold);
  letter-spacing: 0.5px;
}

.slogan-secondary {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f1ede3;
}

.btn-manifesto {
  font-size: 1.05rem;
  padding: 12px 22px;
  box-shadow: 2px 2px 0px #000;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .manifesto-card {
    padding: 32px 16px 24px 16px;
  }

  .solidary-stamp {
    display: none;
  }

  .manifesto-headline {
    font-size: 1.45rem;
  }

  .manifesto-lead {
    font-size: 1.15rem;
  }

  .manifesto-paragraph {
    font-size: 1.02rem;
  }

  .christmas-box-inner {
    padding: 20px 14px;
  }

  .christmas-title {
    font-size: 1.35rem;
  }

  .christmas-subtitle {
    font-size: 0.95rem;
  }

  .christmas-story {
    font-size: 1rem;
  }

  .christmas-pillars-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pillar-card {
    padding: 14px 12px;
  }

  .manifesto-invitation {
    font-size: 1.1rem;
  }

  .manifesto-footer-banner {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 16px;
  }

  .btn-manifesto {
    width: 100%;
    font-size: 0.95rem;
  }
}
</style>
