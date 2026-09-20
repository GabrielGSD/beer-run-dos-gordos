<template>
  <footer id="contato" class="footer-section">
    <!-- Top CTA Banner -->
    <div id="inscricoes" class="footer-cta-banner dark-ribbon">
      <div class="container footer-cta-grid">
        <div class="cta-quote-box">
          <div class="quote-stars font-slab">★ TREINE SE PUDER. SE NÃO PUDER, VENHA MESMO ASSIM. ★</div>
          <div class="quote-sub font-condensed">O IMPORTANTE É PARTICIPAR E APROVEITAR!</div>
        </div>

        <div class="cta-action-box">
          <button
            class="btn-vintage footer-btn"
            @click="$emit('open-registration', 'rodape_banner')"
          >
            <i class="fa-solid fa-beer-mug-empty"></i>
            INSCREVA-SE AGORA
          </button>
          <span class="footer-subtag font-condensed">
            {{ isSoldOut ? '🔥 ÚLTIMAS VAGAS EM REMANEJAMENTO!' : 'VAGAS LIMITADAS!' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main Footer Bar -->
    <div class="footer-main">
      <div class="container footer-main-grid">
        <!-- Stamp Seal Left -->
        <div class="stamp-seal font-condensed">
          <div class="seal-inner">
            <span>RESPEITO</span>
            <span>FOCO</span>
            <span>CERVEJA</span>
            <span>& CHURRASCO</span>
          </div>
        </div>

        <!-- Center Social Links -->
        <div class="footer-social-box">
          <h4 class="social-title font-condensed">ACOMPANHE NOSSAS REDES</h4>
          <div class="social-icons">
            <a href="#" aria-label="Instagram" class="social-btn"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="Facebook" class="social-btn"><i class="fa-brands fa-facebook"></i></a>
            <a href="#" aria-label="TikTok" class="social-btn"><i class="fa-brands fa-tiktok"></i></a>
          </div>
        </div>

        <!-- Right Realization Note -->
        <div class="footer-realization">
          <img src="/logo.png" alt="BEER RUN DOS GORDOS" class="footer-logo" />
          <button
            type="button"
            class="footer-sponsor-btn font-condensed"
            @click="$emit('open-sponsorship')"
          >
            <i class="fa-solid fa-handshake"></i> Seja um Patrocinador
          </button>
          <button
            type="button"
            class="footer-staff-btn font-condensed"
            @click="$emit('open-staff')"
            title="Painel restrito dos organizadores"
          >
            <i class="fa-solid fa-lock"></i> Painel da Staff
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useAthletes } from '../composables/useAthletes.js'

defineEmits(['open-registration', 'open-sponsorship', 'open-staff'])

const { isSoldOut, totalAthletes, maxAthletes } = useAthletes()
</script>

<style scoped>
.footer-section {
  margin-top: 40px;
}

.footer-cta-banner {
  padding: 32px 0;
}

.footer-cta-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.cta-quote-box {
  display: flex;
  flex-direction: column;
}

.quote-stars {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--accent-gold);
  letter-spacing: 0.5px;
}

.quote-sub {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-light);
}

.cta-action-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.footer-btn {
  font-size: 1.2rem;
  padding: 12px 28px;
}

.btn-soldout,
.btn-waitlist {
  background-color: var(--accent-gold) !important;
  color: #1c1b18 !important;
  border-color: #1c1b18 !important;
}

.btn-soldout:hover,
.btn-waitlist:hover {
  background-color: var(--accent-amber) !important;
}

.footer-subtag {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-light);
  letter-spacing: 1px;
}

.subtag-soldout,
.subtag-waitlist {
  color: var(--accent-gold) !important;
  font-weight: 900;
}

.footer-main {
  background-color: #12100e;
  color: var(--text-light);
  padding: 40px 0 30px 0;
  border-top: 2px solid var(--accent-border);
}

.footer-main-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}

.stamp-seal {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--accent-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  transform: rotate(-8deg);
}

.seal-inner {
  display: flex;
  flex-direction: column;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--accent-gold);
  line-height: 1.1;
}

.footer-social-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.social-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: #d1c5b0;
}

.social-icons {
  display: flex;
  gap: 16px;
}

.social-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #24201b;
  border: 2px solid var(--accent-gold);
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
  transform: translateY(-3px);
}

.footer-realization {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.footer-logo {
  height: 50px;
  opacity: 0.85;
}

.footer-sponsor-btn {
  background: rgba(217, 130, 43, 0.15);
  border: 1.5px solid var(--accent-gold);
  color: var(--accent-gold);
  font-size: 0.88rem;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.footer-sponsor-btn:hover {
  background: var(--accent-gold);
  color: var(--accent-dark);
  box-shadow: 0 2px 8px rgba(217, 130, 43, 0.4);
}

.footer-staff-btn {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: #a89a80;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.footer-staff-btn:hover {
  color: var(--accent-gold);
  border-color: var(--accent-gold);
  background: rgba(217, 130, 43, 0.1);
}

.realization-tag {
  font-size: 0.95rem;
  font-weight: 800;
  color: #a89a80;
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 800px) {
  .footer-cta-grid, .footer-main-grid {
    flex-direction: column;
    text-align: center;
  }

  .footer-realization {
    align-items: center;
  }
}
</style>
