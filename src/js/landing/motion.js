function initFeatureStrip() {
  const strip = document.querySelector('.feature-strip');
  const track = strip.querySelector('.feature-strip-track');
  const button = strip.querySelector('.feature-strip-toggle');
  const copy = track.firstElementChild.cloneNode(true);
  copy.removeAttribute('aria-label');
  copy.setAttribute('aria-hidden', 'true');
  track.append(copy);
  strip.classList.add('feature-strip-moving');
  button.hidden = false;
  button.addEventListener('click', () => {
    const paused = strip.classList.toggle('is-paused');
    const action = paused ? 'Continuar' : 'Pausar';
    button.textContent = action;
    button.setAttribute('aria-label', action + ' faixa de recursos');
  });
}

function initLandingMotion() {
  initFeatureStrip();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting) {
            target.classList.add('revealed');
            observer.unobserve(target);
          }
        }
      },
      { rootMargin: '0px 0px -28px 0px' },
    );
    for (const element of document.querySelectorAll('[data-reveal]')) {
      observer.observe(element);
    }
    document.documentElement.classList.add('landing-reveal');
  }

  const canTilt = matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  );
  const preview = document.querySelector('.hero-mock');
  const panel = preview.querySelector('.mock-tilt');
  const reset = () => panel.style.removeProperty('--panel-transform');
  preview.addEventListener('pointermove', (event) => {
    if (!canTilt.matches || event.pointerType === 'touch') {
      return;
    }
    const bounds = preview.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    panel.style.setProperty(
      '--panel-transform',
      `perspective(1000px) translate3d(${x * 28}px, ${y * 12}px, 0) rotateX(${-y * 12}deg) rotateY(${x * 16}deg)`,
    );
  });
  preview.addEventListener('pointerleave', reset);
  canTilt.addEventListener('change', reset);
}

export { initLandingMotion };
